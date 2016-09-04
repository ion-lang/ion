const test = require('tape')
const peg = require('pegjs')
const fs = require('fs')
const glob = require('glob')
const compile = require('./es5-compiler')
const ion = peg.buildParser(fs.readFileSync('./ion.peg', 'utf8'))

const invalidSyntax = (code, msg) => {
  test(msg, (assert) => {
    assert.throws(() => { ion.parse(code) }, /SyntaxError/, `invalid syntax: '${code}'`)
    assert.end()
  })
}

const compileError = (code, err, msg) => {
  test(msg, (assert) => {
    assert.throws(() => { compile(code) }, err, `invalid syntax: '${code}'`)
    assert.end()
  })
}

invalidSyntax('a *= 1', 'no redefinition of variables')
invalidSyntax('a += 1', 'no redefinition of variables')
invalidSyntax('012345678', 'no invalid octals')
invalidSyntax('{ get foo () { 1 } }', 'no getters')
invalidSyntax('{a: 1,}', 'no dangling commas')
invalidSyntax('var a = 1', 'no "var"')
invalidSyntax('function foo() {}', 'no function statement')
invalidSyntax('export 1; a = 2', 'no semicolon')
invalidSyntax('a = 1+1', 'no missing space in binary ops')

compileError(`
export 1
export 2`, /Multiple exports/, 'no multiple export')

glob('samples/*.ion', (err, files) => {
  if (err) {
    throw err
  }

  files.forEach((file) => {
    const code = fs.readFileSync(file, 'utf8')

    test(file, (assert) => {
      let js = null
      assert.doesNotThrow(() => { ion.parse(code) })
      assert.doesNotThrow(() => { js = compile(code) }, 'on code!')
      assert.doesNotThrow(() => { eval(js) }, 'on code!')

      assert.end()
    })
  })
})
