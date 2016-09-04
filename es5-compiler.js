'use strict'

const R = require('ramda')
const prettify = require('./helpers/prettify')

let includedHelpers = []
const parser = require('./parser')

function CompileError (message, e) {
  this.message = message
  this.name = message
  this.location = e.location
}

CompileError.prototype.toString = function () {
  return this.name
}

const opCallMap = {
  '+': 'add',
  '-': 'subtract',
  '*': 'multiply',
  '**': 'pow',
  '/': 'divide',
  '%': 'modulo',
  '>': 'gt',
  '>=': 'gte',
  '<': 'lt',
  '=<': 'lte',
  '==': 'equals',
  '!=': 'diffs'
}

const ramdaAutoIncludes = Object.keys(R)

const opMap = {
  '**': 'pow',
  '==': 'equals',
  '|>': 'pipe',
  '<|': 'compose'
}

const specialOps = ['@', '@?']

const wrap = (code) => `(function(){${code}})()`
const call = (fn, args) => `${fn}(${args.join ? args.join(',') : args})`

let exportCount = 0
let declaredVars = []

function c (e, assignmentId) {
  switch (e.type) {
    case 'Assignment':
      if (e.left.type === 'Id') {
        // TODO: validate duplicated vars
        declaredVars.push(e.left.name)
        var _assignmentId = c(e.left)
        return `const ${_assignmentId}=${c(e.right, _assignmentId)}`
      } else {
        var _assignmentId = c(e.left)
        return `${_assignmentId}=${c(e.right, _assignmentId)}`
      }
    case 'Export':
      if (exportCount > 0) {
        throw new CompileError('Multiple exports', e)
      }

      exportCount++
      return `module.exports = ${c(e.expression)}`
    case 'Program':
      return cAll(e.body)
    case 'Member':
      return e.computed
        ? `${c(e.object)}[${c(e.property)}]`
        : `${c(e.object)}.${c(e.property)}`
    case 'If':
      return e.else
        ? `${c(e.test)}?${c(e.then)}:${c(e.else)}`
        : wrap(`if(${c(e.test)})return ${c(e.then)}`)
    case 'Object':
      const props = []
      var prop
      for (var i = 0; i < e.properties.length; i++) {
        prop = e.properties[i]
        props.push(`${c(prop.key)}: ${c(prop.value)}`)
      }
      return `{${props.join(',')}}`
    case 'Lambda':
      if (e.params.length) {
        const params = cAll(e.params).join(',')
        includedHelpers.push('curry')
        return `curry(function(${params}) {return ${c(e.body)}})`
      } else {
        return `function() {return ${c(e.body)}}`
      }
    case 'Call':
      return call(c(e.callee), cAll(e.args))
    case 'OpCall':
      if (e.op === '@') {
        let path
        switch (e.args[0].type) {
          case 'Array':
          case 'Id':
            includedHelpers.push('lensPath')
            includedHelpers.push('view')

            return call('view', call('lensPath', cAll(e.args)))
          case 'String':
            includedHelpers.push('prop')

            return call('prop', cAll(e.args))
          default:
            throw '???'
        }
      }

      const mapToFn = opCallMap[e.op]
      if (mapToFn) {
        includedHelpers.push(mapToFn)
        return call(mapToFn, cAll(e.args))
      } else {
        throw `Missing implementation of ${e.op}`
      }
    case 'Range':
      includedHelpers.push('range')
      return call('range', [e.from, parseInt(e.to) + 1])
    case 'Unary':
      return `${e.operator}${c(e.argument)}`
    case 'Id':
      if (!~declaredVars.indexOf(e.name)) {
        const ramdaInclude = ~ramdaAutoIncludes.indexOf(e.name)
        if (ramdaInclude) {
          includedHelpers.push(e.name)
        }
      }

      return e.name
    case 'True':
      return 'true'
    case 'False':
      return 'false'
    case 'Null':
      return 'null'
    case 'RegExp':
      try {
        new RegExp(e.value)
      } catch (error) {
        throw new CompileError('Invalid regexp', e)
      }
    case 'Octal':
    case 'Decimal':
    case 'Hex':
      return e.value
    case 'String':
      return JSON.stringify(e.value)
    case 'Unary':
      return `!${c(e.argument)}`
    case 'Binary':
      const l = c(e.left)
      const r = c(e.right)
      const mapTo = opMap[e.operator]

      if (e.operator === '@') {
        includedHelpers.concat('lensPath', 'view')

        return call('view', [call('lensPath', l), r])
      }

      if (mapTo) {
        includedHelpers.push(mapTo)
        return `${mapTo}(${l}, ${r})`
      } else if (e.parens) {
        return `(${l}${e.operator}${r})`
      } else {
        return `${l}${e.operator}${r}`
      }
    case 'Array':
      return `[${cAll(e.elements).join(', ')}]`
    case 'Ternary':
      return `${c(e.test)}?${c(e.consequent)}:${c(e.alternate)}`
    case 'Cond':
      const block = R.map((caze) => (
        caze.test
          ? `if(${c(caze.test)}(${c(e.discriminant)})){return ${c(caze.consequent)}}`
          : `return ${c(caze.consequent)};`
      ), e.cases).join('')
      return wrap(block)
    default:
      console.log('Missing', e.type, e)
      return ''
  }
}

const err = (program, e) => {
  console.log(prettify(program, e.location))
  console.log('---')
  console.log(e.message)
  console.log('---')
  console.log(e.name)
  throw e
}

const cAll = R.map(c)
const MAIN_FUNCTIONS = ['const put = console.log']
const localIncludes = ['pow', 'diffs']
function compile (program) {
  includedHelpers = []
  exportCount = 0
  declaredVars = []

  const ast = parser(program)
  exportCount = 0
  var compiled
  try {
     compiled = c(ast)
  } catch (e) {
    if (e.location) {
      err(program, e)
    } else {
      console.log(e)
    }
  }

  const includes = R.map((helper) => (
    ~R.indexOf(helper, localIncludes)
      ? `const ${helper} = require('./js/${helper}')`
      : `const ${helper} = require('ramda/src/${helper}')`
  ), R.uniq(includedHelpers))

  return MAIN_FUNCTIONS.concat(includes).concat(compiled).join(';\n')
}

module.exports = compile
