const equals = require('ramda/src/equals')
const not = require('ramda/src/not')
const curry = require('ramda/src/curry')

const diffs = curry(function (a, b) {
  return not(equals(a, b))
})

module.exports = diffs
