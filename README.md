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
[Task solution](https://github.com/plaid/async-problem/blob/master/tasks.js).

```js
path = require('path')

readFile = (filename) =>
  Task((rej, res) =>
    fs.readFile(path.resolve(filename), {encoding: 'utf8'}, (err, data) =>
      err ? rej(err) : res(data)))

concatFiles = fs.readFile
  | map(trim)
  | map(split('\n'))
  | map(map(fs.readFile))
  | chain(sequence(Task.of))
  | map(map(trim))
  | map(join(','))

concatFiles('./samples/task/index.txt').fork(
  (err) => put('Error: ', err),
  (data) => put('Result: ', data)
)
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

###### Improved type detection

<table>
  <tr>
    <th>JavaScript</th>
    <th>Ion</th>
  </tr>
  <tr>
    <td>
      <code>
      <pre>
typeof null      // 'object'
typeof []        // 'object'
typeof {}        // 'object'
typeof /a/       // 'object`
    </pre>
      </code>
    </td>
    <td>
	 	<code>
    		<pre>
type(null)       // 'Null'
type([])         // 'Array'
type({})         // 'Object'
type(1)          // 'Number'
type("a")        // 'String'
type(() => 1)    // 'Function'
type(/a/)        // 'Regexp'    		
    		</pre>
      </code>
    </td>
  </tr>
</table>


###### Improved comparisons

Based on Ramda's `equals`:

```js
// All true
1 == 1
"1" == "1"
null == null
[] == []
[1, 2, 3] == [1, 2, 3]
{} == {}
{a: 1} == {a: 1}
/a/ == /a/

// All false
1 == "1"
[3, 2, 1] == [1, 2, 3]
{a: 1} == {a: "1"}
/a/ == /ab/
```

###### All variables are `consts`s

```js
age = 22 // compiles to 'const age = 22'
```

###### All functions are curried

```js
sayTo = (greet, name) => `${greet}, ${name}!`
sayTo('Hello', 'John') // 'Hello, John!'
sayTo('Hello')('John') // 'Hello, John!'

sayHelloTo = sayTo('Hello')
sayHelloTo('John') // 'Hello, John'
```

###### Blocks can have only one expression, and this is returned by default

```js
age = 22
status = if(age >= 18)
  'adult'
else
  'minor'

addFive = (n) => n + 5  
```

###### Ramda is treated as the stdlib

```js
map((a) => a + 1, [1, 2, 3, 4, 5, 6, 7, 8, 9])
// => [2, 3, 4, 5, 6, 7, 8, 9, 10]
```

Once used, Ramda's `map` will be included by default.

###### Operators are seen as functions

```js
map(+(1), [1, 2, 3, 4, 5, 6, 7, 8, 9])
// => [2, 3, 4, 5, 6, 7, 8, 9, 10]
```

###### Range type (only for integers so far)

```js
map(+(1), [1..9])
// => [2, 3, 4, 5, 6, 7, 8, 9, 10]
```

###### Some new operators: `->`, `|>`, `<|`, `@`, `**`, `->>` and more;

`<-` is map

```js
+(1) <- [1..9]
// => [2, 3, 4, 5, 6, 7, 8, 9, 10]
```

`|` is pipe (sorta like in bash)

```js
add2AndThenMult3 = +(2) | *(3)
add2AndThenMult3(1) // => 9
```

`@` gets attribute of object, may be deep (works with Ramda's lens stuff)

```js
'name' @ {name: 'John'} // => 'John'

firstMovieName = ['movies', 0, 'name'] @ {movies: [{name: 'Rambo'}, ...]} // => 'Rambo'

dupAllPrices = map(@('price') | *(2))
dupAllPrices([{price: 1}, {price: 2}]) //  => [2, 4]
```

`**` is Math.pow

```js
3 ** 2 // => 9
```

###### `where` construct

Where makes sure variables are local, and they are part of an expression, so you can do things like:

```js
foo = (x) =>
  a + b where
    a = x * 2,
    b = x * 3
```

### Extended types

###### Maybe

```js
userName = undefined
put(Maybe.fromNullable(userName).getOrElse("anonymous"))
```

###### Either

```js
put(
  Either
    .fromNullable(null)
    .map(+(1))
    .getOrElse(1)
)

put(
  Either
    .fromNullable(5)
    .map(+(1))
    .getOrElse(1)
)
```

###### Task

```js
Task.of(10).fork(
  concat('Err! ') | put,
  concat('Ok! ') | put
)
```





## Examples



## Usage

```
ion -h                 // help
ion file.ion           // compiles to JS, returns to stdout
ion file.ion > file.js // compiles to JS, writes to file.js
ion -e file.ion        // compiles to JS, executes with node (4+ will work)
ion -a file.ion        // returns ion's AST
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
