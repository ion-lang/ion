<p align="center">
 <img src="logo.png" /
</p>

# ion language

Ion is a little language that compiles to JavaScript. It doesn't try to be completely different than JavaScript, but it attemps to strip it to the minimal set of functional features of the language, while exteding it to have some more. It relies heavily on [Ramda](https://github.com/ramda/ramda).

Main features:

- Improved type detection;
- Improved comparisons;
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

JavaScript:

```js
typeof null      // 'object'
typeof []        // 'object'
typeof {}        // 'object'
typeof /a/       // 'object`
```

Ion (based on Ramda's `type`):

```js
type(1)          // 'Number'
type("a")        // 'String'
type(null)       // 'Null'
type([])         // 'Array'
type({})         // 'Object'
type(() => 1)    // 'Function'
type(/a/)        // 'Regexp`
```

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

`|>` is pipe

```js
add2AndThenMult3 = +(2) |> *(3)
add2AndThenMult3(1) // => 9
```

`<|` is compose

```js
mult3AndThenAdd2 = +(2) <| *(3)
mult3AndThenAdd2(1) // => 5
```

`@` gets attribute of object, may be deep (works with Ramda's lens stuff)

```js
'name' @ {name: 'John'} // => 'John'

firstMovieName = ['movies', 0, 'name'] @ {movies: [{name: 'Rambo'}, ...]} // => 'Rambo'

dupAllPrices = map(@('price') |> *(2))
dupAllPrices([{price: 1}, {price: 2}]) //  => [2, 4]
```

`**` is Math.pow

```js
3 ** 2 // => 9
```

`->>` is `always` (a function that always returns a determined value)

```js
a = ->> 5
a() // => 5
```

###### `where` construct

Where makes sure variables are local, and they are part of an expression, so you can do things like:

```js
foo = (x) =>
  a + b where
    a = x * 2,
    b = x * 3
```


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
- Elm: nice operators for composition;
- io: everything is a function / very few reserve words;
- es6/7: spreads, template strings, lambda syntax...;
- es5: everything else;
- Cobol: just kidding;

## Status

Ion is still a toy language and far from 1.0. Beware.
