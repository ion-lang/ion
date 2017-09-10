// TODO: create firstPass to check for errs before compiling... will simplify code a location
// TODO: create a compile compatible with JS AST
// TODO: create a centralized TODO list
// TODO: use latest folktale
'use strict'
const R = require('ramda')
const displayError = require('../helpers/displayError')
const parse = require('../parse')
const CompileError = require('../helpers/CompileError')
let includedHelpers = []

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
  '!=': 'diffs',
  '|': 'pipe',
  '<-': 'map',
}

const autoIncludes = R.fromPairs(R.map(r => [r, `ramda/src/${r}`], Object.keys(R)))
autoIncludes['pow'] = '../js/pow'
autoIncludes['then'] = '../js/then'
autoIncludes['catch'] = '../js/catch'
autoIncludes['diffs'] = '../js/diffs'
autoIncludes['fs'] = '../js/fs'

autoIncludes['task'] = 'folktale/concurrency/task'
autoIncludes['Maybe'] = 'folktale/maybe'
autoIncludes['Result'] = 'folktale/result'
autoIncludes['Validation'] = 'folktale/validation'
autoIncludes['path'] = 'path'

const opMap = opCallMap
// {
//   '**': 'pow',
//   '==': 'equals',
// }

const specialOps = ['@', '@?']

const wrap = code => `(function(){${code}})()`
const call = (fn, args) => `${fn}(${args.join ? args.join(',') : args})`

let exportCount = 0
// TODO: declared vars may be only in some context...
// check where!
let declaredVars = {global: []}
let mapTo = null

function c(e, assignmentContext = {id:'global', line:1}) {
  switch (e.type) {
    case 'Assignment':
      if (e.left.type === 'Id') {
        // TODO: save the initial variable declaration location,
        // then show in the error both lines.
        if (~declaredVars[assignmentContext.id].indexOf(e.left.name)) {
          if(assignmentContext.id === 'global') {
            throw new CompileError(`Variable '${e.left.name}' has already been declared globally.`, e)
          } else {
            throw new CompileError(`Variable '${e.left.name}' has already been declared in context started on line ${assignmentContext.line}.`, e)
          }
        }

        declaredVars[assignmentContext.id].push(e.left.name)

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
      // console.log(e)
      const newAssignmentContext = {
        id: `ctxt-${e.location.start.line}`,
        line: e.location.start.line
      }
      declaredVars[newAssignmentContext.id] = []

      return wrap(`${cAll(e.assignments, newAssignmentContext).join(';')};return ${c(e.expression)}`)
    case 'Program':
      return cAll(e.body)
    case 'Member':
      return e.computed ? `${c(e.object)}[${c(e.property)}]` : `${c(e.object)}.${c(e.property)}`
    case 'If':
      return e.else
        ? `${c(e.test)}?${c(e.then)}:${c(e.else)}`
        : wrap(`if(${c(e.test)})return ${c(e.then)}`)
    case 'Object':
      if (R.any(p => p.type === 'Spread', e.properties)) {
        includedHelpers.push('mergeAll')

        return `mergeAll([${R.map(p => (p.type === 'Spread' ? c(p) : `{${c(p.key)}: ${c(p.value)}}`), e.properties).join(', ')}])`
      } else {
        const props = R.map(p => `${c(p.key)}: ${c(p.value)}`, e.properties)
        return `{${props.join(',')}}`
      }

    case 'Lambda':
      const params = cAll(e.params).join(',')
      if (e.params.length > 1) {
        includedHelpers.push('curry')
        return `curry(function(${params}) {return ${c(e.body)}})`
      } else {
        return `function(${params}) {return ${c(e.body)}}`
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
      if (!~declaredVars.global.indexOf(e.name)) {
        if (autoIncludes[e.name]) {
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
        if (e.left.type === 'Array') {
          includedHelpers.push('lensPath')
          includedHelpers.push('view')

          return call('view', [call('lensPath', l), r])
        } else {
          includedHelpers.push('prop')

          return call('prop', [l, r])
        }
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
      if (R.any(el => el.type === 'Spread', e.elements)) {
        includedHelpers.push('reduce')
        includedHelpers.push('concat')

        return `reduce(concat, [], [${R.map(el => (el.type === 'Spread' ? c(el) : `[${c(el)}]`), e.elements)}])`
      } else {
        return `[${cAll(e.elements).join(', ')}]`
      }
    case 'Spread':
      return c(e.spreaded)
    case 'Ternary':
      return `${c(e.test)}?${c(e.consequent)}:${c(e.alternate)}`
    case 'Header':
      return ''
    case 'WrongHeader':
      throw new CompileError(`Wrong header '${e.path}'. A correct header would be '#!/usr/bin/env ion'`, e)
    default:
      console.log('Missing', e.type, e)
      return ''
  }
}

const cAll = (list, assignmentContext) =>
  R.map(item => c(item, assignmentContext), list)

const MAIN_FUNCTIONS = ['const put = console.log']
function compile(code, parser) {
  const ast = parse(code, parser)

  includedHelpers = []
  exportCount = 0
  declaredVars = { global: [] }
  exportCount = 0
  var compiled
  try {
    compiled = c(ast)
  } catch (e) {
    if (e.location) {
      throw displayError(code, e)
    } else {
      throw e
    }
  }

  const includes = R.map(
    helper => `const ${helper} = require('${autoIncludes[helper]}')`,
    R.uniq(includedHelpers)
  )

  return MAIN_FUNCTIONS.concat(includes).concat(compiled).join(';\n')
}

module.exports = compile
