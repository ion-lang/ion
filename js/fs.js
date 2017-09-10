// TODO: create a fs-task lib and use that instead

const { fromNodeback } = require('folktale/concurrency/task')
const fs = require('fs')
const { map, fromPairs } = require('ramda')

const methods = [
  'readFile'
]

const fsTask = fromPairs(map(method => {
  return [method, fromNodeback(fs[method])]
}, methods))

module.exports = fsTask