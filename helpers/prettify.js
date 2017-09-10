const R = require('ramda')
const colors = require('colors/safe')

const mapWithIndex = R.addIndex(R.map)
const compact = R.reject(R.isNil)
const dots = R.times(R.always('.'))
const dashes = R.times(R.always('_'))
const spaces = R.times(R.always(' '))

module.exports = function prettify (code, {expected, found, location}) {
  return '...\n' + compact(mapWithIndex((line, idx) => {
    if (location.start.line - 6 > idx ||
      location.start.line + 6 < idx) return
    if (idx + 1 === location.start.line) {
      const [start, errorAndEnd] = R.splitAt(location.start.column - 1, line)
      const [error, end] = R.splitAt(location.end.column - location.start.column, errorAndEnd)

      // console.log()
      return colors.red(` ${idx + 1} | ${start}`) + colors.red.inverse(error) + colors.red(end)
        + "\n" + spaces(5).join('') +
        colors.dim(`${dots(location.start.column - 1).join('')}`) + '^'
        // `\\${dashes(location.end.column - location.start.column - 2).join('')}/`)
    } else {
      return colors.gray(` ${idx + 1} | `) +  line
    }
  }, code.split('\n'))).join('\n') + '\n...'
}
