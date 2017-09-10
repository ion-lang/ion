const peg = require('pegjs')
const path = require('path')
const fs = require('fs')
const glob = require('glob')
const ion = peg.buildParser(fs.readFileSync('./ion.peg', 'utf8'))
const firstPass = require('../compilers/firstPass')
const files = glob.sync(path.join(__dirname, 'fixtures/compile_errors/*.ion'))

const expectedFiles = 4

if(files.length !== expectedFiles) throw(`Expected ${expectedFiles} files`)

files.forEach((file) => {
  test(`compile error for ${path.basename(file)}`, () => {
    try{
      firstPass(fs.readFileSync(file, 'utf8'), ion.parse)
      fail()
    }catch(e){
      expect(e).toMatchSnapshot()
    }
  })
})
