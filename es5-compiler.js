'use strict'

const R = require('ramda')
const displayError = require('./helpers/displayError')

let includedHelpers = []
const parser = require('./parser')

function CompileError (message, e) {
  this.message = message
  this.name = 'CompileError'
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
  '<|': 'compose',
  '->>': 'always'
}

const specialOps = ['@', '@?']

const wrap = (code) => `(function(){${code}})()`
const call = (fn, args) => `${fn}(${args.join ? args.join(',') : args})`

let exportCount = 0
let declaredVars = []
let mapTo = null

function c (e, assignmentId) {
  switch (e.type) {
    case 'Assignment':
      if (e.left.type === 'Id') {
        if (~declaredVars.indexOf(e.left.name)) {
          throw new CompileError(`Variable '${e.left.name}' has already been declared.`, e)
        }

        declaredVars.push(e.left.name)

        var _assignmentId = c(e.left)
        return `const ${_assignmentId} = ${c(e.right, _assignmentId)}`
      } else {
        var _assignmentId = c(e.left)
        return `${_assignmentId} = ${c(e.right, _assignmentId)}`
      }
    case 'Export':
      if (exportCount > 0) {
        throw new CompileError('Multiple exports', e)
      }

      exportCount++
      return `module.exports = ${c(e.expression)}`
    case 'Where':
      return wrap(`${cAll(e.assignments).join(';')};return ${c(e.expression)}`)
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
      if (R.any((p) => p.type === 'Spread', e.properties)) {
        includedHelpers.push('mergeAll')

        return `mergeAll([${R.map((p) => p.type === 'Spread' ? c(p) : `{${c(p.key)}: ${c(p.value)}}`, e.properties).join(', ')}])`
      } else {
        const props = R.map((p) => `${c(p.key)}: ${c(p.value)}`, e.properties)
        return `{${props.join(',')}}`
      }

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
      mapTo = opMap[e.operator]

      if (mapTo) {
        includedHelpers.push(mapTo)
        return `${mapTo}(${c(e.argument)})`
      // } else if (e.parens) {
        // return `(${l}${e.operator}${r})`
      } else {
        return `${e.operator}${c(e.argument)}`
      }

    case 'Binary':
      const l = c(e.left)
      const r = c(e.right)
      mapTo = opMap[e.operator]

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
      if (R.any((el) => el.type === 'Spread', e.elements)) {
        includedHelpers.push('reduce')
        includedHelpers.push('concat')

        return `reduce(concat, [], [${R.map((el) => el.type === 'Spread' ? c(el) : `[${c(el)}]`, e.elements)}])`
      } else {
        return `[${cAll(e.elements).join(', ')}]`
      }
    case 'Spread':
      return c(e.spreaded)
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
      displayError(program, e)
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
