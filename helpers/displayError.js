const prettify = require('./prettify')
const CompileError = require('./CompileError')
const {bold, red, dim} = require('colors/safe')
const R = require('ramda')

module.exports = (code, e) => {
  const descriptions = e.expected
    ? R.map(R.prop('description'), e.expected)
    : []

  let result = ''
  const {line, column} = e.location.start

  errorType = e instanceof CompileError ? 'Compile error' : 'Parsing error'
  result += bold(red(`${errorType} on line ${line}, column ${column}: `))
  result += dim(e.message) + '\n'

  if(R.contains('statement', descriptions)) {
    const lines = code.split('\n')
    // TODO: explain to the user what is a statement and why everything in
    // ion is a statement.
    result += `"${lines[line - 1]}" is not a statement.\n`
  } else {
    result += '\n'
  }
  result += prettify(code, e)

  return result
}
