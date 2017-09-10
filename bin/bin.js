const fs = require('fs')
const prettyjson = require('prettyjson')
const program = require('commander')
const compiler = require('../es5-compiler')
const parse = require('../parse')

const bin = (parser) => {
  program
    .version('0.0.1')
    .usage('[options] <file ...>')
    .option('-c --compile', 'compiles an ion script to es5')
    .option('-a --ast', 'returns an AST')
    .option('-t --try', 'simply try parsing and returns true or error')
    .option('-e --exec', 'compiles and runs the program using node')
    .option('-r --run', 'compiles and runs arbitrary code using node')
    .parse(process.argv)

  const code = program.run ? program.args[0] : fs.readFileSync(program.args[0], 'utf8')

  switch (true) {
    case program.ast:
      const ast = parse(code, parser)
      console.log(prettyjson.render(ast))
      break
    case program.try:
      const [err] = parse.testable(code, parser)
      console.log(err || true)
      break
    case program.compile:
      console.log(compiler(code, parser))
      break
    case program.exec:
    case program.run:
    default:
      eval(compiler(code, parser))
  }
}

module.exports = bin