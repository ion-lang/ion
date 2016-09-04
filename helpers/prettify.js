const R = require('ramda')

const mapWithIndex = R.addIndex(R.map)
const compact = R.reject(R.isNil)
const dashes = R.times(() => '-')

module.exports = function prettify (code, location) {
  return '...\n' + compact(mapWithIndex((line, idx) => {
    if (location.start.line - 6 > idx ||
      location.start.line + 6 < idx) return
    return idx + 1 === location.start.line
      ? `${idx} ${line}\n${dashes(location.start.column + 2).join('')}^`
      : `${idx} ${line}`
  }, code.split('\n'))).join('\n') + '\n...'
}
