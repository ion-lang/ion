const displayError = require('./helpers/displayError')
const colors = require('colors/safe')

const testable = (program, parser) => {
  if (!parser) {
    parser = require('./ion').parse
  }

  try {
    return [null, parser(program)]
  } catch (e) {
    if (e.location) {
      return [displayError(program, e), null]
    } else {
      return [e, null]
    }
  }
}

module.exports = (program, parser) => {
  const [err, parsed] = testable(program, parser)

  if(parsed) return parsed
  console.log(err)
  process.exit(1)
}
module.exports.testable = testable