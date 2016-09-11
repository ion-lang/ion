const displayError = require('./helpers/displayError')
const ion = require('./ion')
const colors = require('colors/safe')

module.exports = (program) => {
  try {
    return ion.parse(program)
  } catch (e) {
    if (e.location) {
      displayError(program, e)
    } else {
      console.log(e)
    }
  }
}
