const R = require('ramda')
const colors = require('colors/safe')

const mapWithIndex = R.addIndex(R.map)
const compact = R.reject(R.isNil)
const dots = R.times(R.always('.'))
const spaces = R.times(R.always(' '))

module.exports = function prettify (code, location) {
  return '...\n' + compact(mapWithIndex((line, idx) => {
    if (location.start.line - 6 > idx ||
      location.start.line + 6 < idx) return
    return idx + 1 === location.start.line
      ? colors.red.inverse(` ${idx + 1} | ${line}`)
        + "\n" + spaces(5).join('') + colors.dim(`${dots(location.start.column - 1).join('')}^`)
      : colors.gray(` ${idx + 1} | `) +  line
  }, code.split('\n'))).join('\n') + '\n...'
}
