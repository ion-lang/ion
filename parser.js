const prettify = require('./helpers/prettify')
const ion = require('./ion')
const colors = require('colors/safe')

module.exports = (program) => {
  try {
    return ion.parse(program)
  } catch (e) {
    if (e.location) {
      console.log("\n", colors.bold.red(e.name), colors.dim(e.message))
      console.log(prettify(program, e.location))
    } else {
      console.log(e)
    }
  }
}
