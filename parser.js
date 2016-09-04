const prettify = require('./helpers/prettify')
const ion = require('./ion')

module.exports = (program) => {
  try {
    return ion.parse(program)
  } catch (e) {
    if (e.location) {
      console.log(prettify(program, e.location))
      console.log('---')
      console.log(e.message)
      console.log('---')
      console.log(e.name)
    } else {
      console.log(e)
    }
  }
}
