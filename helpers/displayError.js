const prettify = require('./prettify')
const colors = require('colors/safe')


module.exports = (program, e) => {
  console.log("\n", colors.bold.red(e.name), colors.dim(e.message))
  console.log(prettify(program, e.location))

  process.exit(1)
}
