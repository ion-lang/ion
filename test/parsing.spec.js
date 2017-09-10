const peg = require('pegjs')
const path = require('path')
const fs = require('fs')
const glob = require('glob')
const ion = peg.buildParser(fs.readFileSync('./ion.peg', 'utf8'))
const testable = require('../parse').testable

const files = glob.sync(path.join(__dirname, 'fixtures/samples/*.ion'))

const expectedFiles = 34

if(files.length !== expectedFiles) throw(`Expected ${expectedFiles} files`)

files.forEach((file) => {
  test(`parse succeeds for ${path.basename(file)}`, () => {
    const [err, ast] = testable(fs.readFileSync(file, 'utf8'), ion.parser)

    expect(ast).toMatchSnapshot()
    expect(err).toBe(null)
  })
})
