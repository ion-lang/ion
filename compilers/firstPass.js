'use strict'
const R = require('ramda')
const displayError = require('../helpers/displayError')
const parse = require('../parse')
const CompileError = require('../helpers/CompileError')

let exportCount = 0
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
      }

      return c(e.left) || c(e.right)
    case 'Export':
      if (exportCount > 0) {
        throw new CompileError('Multiple exports', e)
      }

      exportCount++
      return c(e.expression)
    case 'Where':
      // console.log(e)
      const newAssignmentContext = {
        id: `ctxt-${e.location.start.line}`,
        line: e.location.start.line
      }
      declaredVars[newAssignmentContext.id] = []

      return cAll(e.assignments, newAssignmentContext) || c(e.expression)
    case 'Program':
      return cAll(e.body)
    case 'Member':
      return c(e.object) || c(e.property)
    case 'If':
      return e.else
        ? (c(e.test) || c(e.then) || c(e.else))
        : (c(e.test) || c(e.then))
    case 'Object':
      if (R.any(p => p.type === 'Spread', e.properties)) {

        return R.map(p => p.type === 'Spread' ? c(p) : (c(p.key) || c(p.value)), e.properties)
      } else {
        return R.map(p => (c(p.key) || c(p.value)), e.properties)
      }

    case 'Lambda':
      return cAll(e.params) || c(e.body)

    case 'Call':
      return c(e.callee) || cAll(e.args)

    case 'OpCall':
      return cAll(e.args)
    case 'Range':
    case 'Id':
    case 'True':
    case 'False':
    case 'Null':
    case 'Octal':
    case 'Decimal':
    case 'Hex':
    case 'Header':
      return ''
    case 'String':
      return JSON.stringify(e.value)
    case 'RegExp':
      try {
        new RegExp(e.value)
      } catch (error) {
        throw new CompileError('Invalid regexp', e)
      }
      return e.value
    case 'Unary':
      return c(e.argument)

    case 'Binary':
      return c(e.left) || c(e.right)

    case 'Array':
      return cAll(e.elements)
    case 'Spread':
      return c(e.spreaded)
    case 'Ternary':
      return c(e.test) || c(e.consequent) || c(e.alternate)
    case 'WrongHeader':
      throw new CompileError(`Wrong header '${e.path}'. A correct header would be '#!/usr/bin/env ion'`, e)
    default:
      console.log('Missing', e.type, e)
      return ''
  }
}

const cAll = (list, assignmentContext) =>
  R.map(item => c(item, assignmentContext), list)

function firstPass(code, parser) {
  const ast = parse(code, parser)

  exportCount = 0
  declaredVars = { global: [] }
  exportCount = 0

  try {
    c(ast)
  } catch (e) {
    if (e.location) {
      throw displayError(code, e)
    } else {
      throw e
    }
  }


  return true
}

module.exports = firstPass
