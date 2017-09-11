// TODO: create firstPass to check for errs before compiling... will simplify code a location
// TODO: create a compile compatible with JS AST
// TODO: create a centralized TODO list
// TODO: use latest folktale
'use strict'
const R = require('ramda')
const displayError = require('../helpers/displayError')
const parse = require('../parse')
const CompileError = require('../helpers/CompileError')
const prettier = require('prettier')
let includedHelpers = []
let value

const gen = require('escodegen')
// throw "!"

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

const merge = (ion, updates) => {
  const merged = R.merge(ion, updates)
  delete merged.location
  delete merged.args
  return merged
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

// const wrap = code => `(function(){${code}})()`
// const call = (fn, args) => `${fn}(${args.join ? args.join(',') : args})`

let exportCount = 0
// TODO: declared vars may be only in some context...
// check where!
let declaredVars = {global: []}
let mapTo = null

function c(e, assignmentContext = {id:'global', line:1}) {
  switch (e.type) {
    case 'Assignment':
      return merge(e, {type: 'AssignmentExpression', operator: '=', left: c(e.left), right: c(e.right)})
      // if (e.left.type === 'Id') {
      //   // TODO: save the initial variable declaration location,
      //   // then show in the error both lines.
      //   if (~declaredVars[assignmentContext.id].indexOf(e.left.name)) {
      //     if(assignmentContext.id === 'global') {
      //       throw new CompileError(`Variable '${e.left.name}' has already been declared globally.`, e)
      //     } else {
      //       throw new CompileError(`Variable '${e.left.name}' has already been declared in context started on line ${assignmentContext.line}.`, e)
      //     }
      //   }
      //
      //   declaredVars[assignmentContext.id].push(e.left.name)
      //
      //   var _assignmentId = c(e.left)
      //   return `const ${_assignmentId} = ${c(e.right, _assignmentId)}`
      // } else {
      //   var _assignmentId = c(e.left)
      //   return `${_assignmentId} = ${c(e.right, _assignmentId)}`
      // }
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
    // throw '0'
      return merge(e, {body: R.map(expression => ({
        type: 'ExpressionStatement',
        expression
      }),cAll(e.body))})
    case 'Member':
      return e.computed ? `${c(e.object)}[${c(e.property)}]` : `${c(e.object)}.${c(e.property)}`
    case 'If':
      return e.else
        ? `${c(e.test)}?${c(e.then)}:${c(e.else)}`
        : wrap(`if(${c(e.test)})return ${c(e.then)}`)
    case 'Object':
    // console.log('>>>', e.properties)
      return merge(e, {type: 'ObjectPattern', properties: R.map(p => {
        console.log('P>>>', p)
        return  {
          type: 'Property',
          // start: 5,
          // end: 8,
          method: false,
          shorthand: false,
          computed: false,
          key: c(p.key),
          value: c(p.value),
          kind: 'init'
        }
      }, e.properties)})
      // TODO
      // if (R.any(p => p.type === 'Spread', e.properties)) {
      //   includedHelpers.push('mergeAll')
      //
      //   return `mergeAll([${R.map(p => (p.type === 'Spread' ? c(p) : `{${c(p.key)}: ${c(p.value)}}`), e.properties).join(', ')}])`
      // } else {
      //   const props = R.map(p => `${c(p.key)}: ${c(p.value)}`, e.properties)
      //   return `{${props.join(',')}}`
      // }

    case 'Lambda':
      return merge(e, {type: 'ArrowFunctionExpression', params: cAll(e.params), body: {
        type: 'BlockStatement', body: [
          {
            type: 'ReturnStatement',
            argument: c(e.body)
          }
        ]
      }})
      // TODO:
      // const params = cAll(e.params).join(',')
      // if (e.params.length > 1) {
      //   includedHelpers.push('curry')
      //   return `curry(function(${params}) {return ${c(e.body)}})`
      // } else {
      //   return `function(${params}) {return ${c(e.body)}}`
      // }
    case 'Call':
    // throw "1"
      return merge(e, {type: 'CallExpression', callee: c(e.callee), arguments: cAll(e.args), args: undefined})
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
      // if (!~declaredVars.global.indexOf(e.name)) {
      //   if (autoIncludes[e.name]) {
      //     includedHelpers.push(e.name)
      //   }
      // }

      return merge(e, {type: 'Identifier'})
    case 'True':
      return merge(e, {type: 'Literal', value: true})
    case 'False':
      return merge(e, {type: 'Literal', value: false})
    case 'Null':
      return merge(e, {type: 'Literal', value: null})
    case 'RegExp':
      return merge(e, {type: 'Literal', value: e.value})
    case 'Octal':
    case 'Decimal':
    case 'Hex':
      return merge(e, {type: 'Literal', value: parseFloat(e.value)})
    case 'String':
      return merge(e, {type: 'Literal', value: e.value})
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

      return merge(e, {type: 'BinaryExpression', left: c(e.left), right: c(e.right)})
      const l = c(e.left)
      const r = c(e.right)
      mapTo = opMap[e.operator]

      // TODO:
      // if (e.operator === '@') {
      //   if (e.left.type === 'Array') {
      //     includedHelpers.push('lensPath')
      //     includedHelpers.push('view')
      //
      //     return call('view', [call('lensPath', l), r])
      //   } else {
      //     includedHelpers.push('prop')
      //
      //     return call('prop', [l, r])
      //   }
      // }

      if (mapTo) {
        includedHelpers.push(mapTo)
        return `${mapTo}(${l}, ${r})`
      } else if (e.parens) {
        return `(${l}${e.operator}${r})`
      } else {
        return `${l}${e.operator}${r}`
      }
    case 'Array':
      return merge(e, {type: 'ArrayPattern', elements: cAll(e.elements)})
      // TODO:
      // if (R.any(el => el.type === 'Spread', e.elements)) {
      //   includedHelpers.push('reduce')
      //   includedHelpers.push('concat')
      //
      //   return `reduce(concat, [], [${R.map(el => (el.type === 'Spread' ? c(el) : `[${c(el)}]`), e.elements)}])`
      // } else {
      //   return `[${cAll(e.elements).join(', ')}]`
      // }
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

const cAll = R.map(c)

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


  return prettier.format(gen.generate(compiled, {
    format: {
      indent: {
        style: '  '
      },
      parentheses: false
    }
  }))
  return JSON.stringify(compiled, null, 1)
  // return MAIN_FUNCTIONS.concat(includes).concat(compiled).join(';\n')
}

module.exports = compile
