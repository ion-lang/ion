const equals = require('ramda/src/equals')
const not = require('ramda/src/not')
const pipe = require('ramda/src/pipe')

module.exports = diffs = pipe(not, equals)
