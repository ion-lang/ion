<p align="center">
 <img src="logo.png" />

# ion language

Ion is a little language that compiles to JavaScript. It doesn't try to be
completely different than JavaScript, but it attemps to strip it to the minimal
set of functional features of the language, while extending it to have some
more. It relies heavily on libraries supporting
[Fantasy Land](https://github.com/fantasyland/fantasy-land), such as
[Ramda](https://github.com/ramda/ramda),
[Santuary](https://github.com/sanctuary-js/sanctuary) and
[Folktale](https://github.com/folktale/)

##### One example

The following example is a solution to the
["async problem"](https://github.com/plaid/async-problem), using the same tools
behind the scenes as the
[task solution](https://github.com/plaid/async-problem/blob/master/tasks.js).

```js
path = require('path')

read = path.resolve
  | fs.readFile
  | map(toString)
  | map(split('\n'))
  | map(map(fs.readFile))
  | chain(task.waitAll)
  | map(map(toString))
  | map(join(','))
  | map(put)

read('./test/fixtures/samples/task/index.txt').mapRejected(put).run()
```

##### Features

- Improved type detection and comparisons;
- All variables are `const`s;
- All functions are curried;
- Blocks can have only one expression, and this is returned by default;
- Ramda is treated as the stdlib;
- Operators are seen as functions;
- Range type (only for integers so far);
- Some new operators: `->`, `|>`, `<|`, `@`, `**`, `->>` and more;
- `where` construct;

Things removed:

- `this`, `class` and all things OO;
- `function`: only lambdas;
- `typeof`: use only `type` function;
- `switch/case`: use `cond` function;
- All mutable ops, like `-=`, `*=`, `++` ...;
- All 3 char ops, like `===`, `!==`;
- Many unknown JS features, like `>>`, `>>>`;


##### Improved type detection
```js

// JS          |   // Ion
typeof null    |   type(null)
// 'object'    |   // 'Null'
typeof []      |   type([])
// 'object'    |   // 'Array'
typeof {}      |   type({})
// 'object'    |   // 'Object'
typeof /a/     |   type(/a/)
// 'object'    |   // 'Regexp'
```
##### Improved comparisons
```js
// JS          |   // Ion
1 == "1"       |   1 == "1"
// true        |   // false
NaN == NaN     |   NaN == NaN
// false       |   // true
[] == []       |   [] == []
// false       |   // true
{} == {}       |   {} == {}
// false       |   // true
/a/ == /a/     |   /a/ == /a/
// false       |   // true
```
##### All variables are `consts`s
```js
// JS          |   // Ion
const age = 22 | age = 22
let age = 22   | // check "where" below
var age = 22   | // check "where" below
```
##### All functions are curried
```js
sayTo = (greet, name) =>
  `${greet}, ${name}!`
sayTo('Hello', 'John') // 'Hello, John!'
sayTo('Hello')('John') // 'Hello, John!'

sayHelloTo = sayTo('Hello')
sayHelloTo('John') // 'Hello, John'
```
##### Blocks can have only one expression, and this is returned by default
```js
age = 22
status = if(age >= 18)
  'adult'
else
  'minor'

addFive = (n) => n + 5  
```
##### Ramda is treated as the stdlib
```js
map((a) => a + 1, [1, 2, 3]) // => [2, 3, 4]
```
##### Operators are seen as functions
```js
map(+(1), [1, 2, 3]) // => [2, 3, 4]
```
##### Range type (only for integers so far)
```js
map(+(1), [1..3]) // => [2, 3, 4]
```
##### Some new operators:
```js
// `<-` is map

+(1) <- [1..3] // => [2, 3, 4]

// `|` is pipe (sorta like in bash)

add2AndThenMult3 = +(2) | *(3)
add2AndThenMult3(1) // => 9

// `@` gets attribute of object, may be deep

'name' @ {name: 'John'} // => 'John'

['movies', 0, 'name'] @ {movies: [{name: 'Rambo'}, ...]} // => 'Rambo'

dupAllPrices = map(@('price') | *(2))
dupAllPrices([{price: 1}, {price: 2}]) //  => [2, 4]
```
##### `where` construct
Where makes sure variables are local, and they are part of an expression.
It's a safe substitute for var/let:
```js
foo = (x) =>
  a + b where
    a = x * 2,
    b = x * 3
```

### Extended types

```js
// Maybe

Maybe.fromNullable(undefined) // Nothing
Maybe.fromNullable('john')    // Just(john)

// Result

Result.Ok(5)
Result.Error('Ooops')

// task (equivalent of Promise)

wait = (secs) =>
  task.task((resolver) =>
    resolver.cleanup(() => clearTimeout(timer)) where
      timer = setTimeout(() => resolver.resolve(secs), secs * 1000))

// gets first task to succeed and automatically cleans up others
task.waitAny([wait(2), wait(1)]).map(put).run()
```

## Usage

```
ion -h                    // help
ion -c file.ion           // compiles to JS, returns to stdout
ion -c file.ion > file.js // compiles to JS, writes to file.js
ion -e file.ion           // compiles to JS, executes with node (4+ will work)
ion -a file.ion           // returns ion's AST
ion -r 'put("Hello")'     // executes some arbitrary code
ion -t file.ion           // simply tries parsing and return true or error
```

## Credits

ion is inspired by:

- Ramda;
- Haskell: operators as functions, currying by default, etc...;
- Elm/Elixir: nice operators for composition;
- io: everything is a function / very few reserve words;
- es6/7: spreads, template strings, lambda syntax...;
- es5: everything else;
- Cobol: just kidding;

## Status

Ion is still a toy language and far from 1.0. Beware.
