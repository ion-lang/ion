const peg = require('pegjs')
const path = require('path')
const fs = require('fs')
const glob = require('glob')
const ion = peg.buildParser(fs.readFileSync('./ion.peg', 'utf8'))
// const testable = require('../parse').testable
const compile = require('../compilers/es5-manual')
const files = glob.sync(path.join(__dirname, 'fixtures/samples/*.ion'))

const expectedFiles = 35
if(files.length !== expectedFiles) throw(`Expected ${expectedFiles} files`)

files.forEach((file) => {
  test(`compile succeeds for ${path.basename(file)}`, () => {
    try{
      const js = compile(fs.readFileSync(file, 'utf8'), ion.parse)
      expect(js).toMatchSnapshot()
    }catch(e){
      fail(e)
    }
  })
})
