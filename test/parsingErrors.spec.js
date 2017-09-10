const peg = require('pegjs')
const path = require('path')
const fs = require('fs')
const glob = require('glob')
const ion = peg.buildParser(fs.readFileSync('./ion.peg', 'utf8'))
const testable = require('../parse').testable

const files = glob.sync(path.join(__dirname, 'fixtures/parse_errors/*.ion'))

const expectedFiles = 17

if(files.length !== expectedFiles) throw(`Expected ${expectedFiles} files`)

files.forEach((file) => {
  test(`parse error for ${path.basename(file)}`, () => {
    const [err] = testable(fs.readFileSync(file, 'utf8'), ion.parser)

    expect(err).not.toBe(null)
    expect(err).toMatchSnapshot()
  })
})
