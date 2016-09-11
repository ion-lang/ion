# Roadmap (aka brainstorming)

#### To be implemented for sure

- `import`, instead of `require()`?
	- Fix require.default issue (when importing es6 modules one has to add `.default` in the requires;
- map as -> / <- (although it says it works in the README, it doesn't :/)
- Remove `if` construct, have it [only as a function](http://ramdajs.com/0.22.1/docs/#ifElse);
- Error handling: Alternatives: just follow [`tryCatch`](http://ramdajs.com/0.22.1/docs/#tryCatch); follow Haskell (try, catch...); have a proper construct closer to es5: `try Expression catch(e) Expression finally Expression` ?
- Backticks strings (aka template strings) work, but not with proper iterpolation;


#### Just ideas

- Promises/Tasks? some better syntax?
- Some very specific syntax for reducers?
- pairs are very useful, why not having them?
	```
	coordinates = (5, 6) //or |5, 6|?
	```
	but what is the point, if there's no pattern matching?
- Use sanctuary instead of just Ramda?	