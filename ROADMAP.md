# Roadmap (aka brainstorming)

#### To be implemented for sure

1.  Finish escodegen compiler;
2.  Implement fs-task, exec-task and other stdlib wrappers for task;
3.  Make sure paralleljs works fine in ion;
4.  Add decent examples of error handling using Result;
5.  Fix multiple pipes issue (`a | b | c` generates `pipe(a, pipe(b, c))`)
6.  Figure out how to consume classes from JS. It's hard withou `new`. Maybe we
    can make it like Ruby: `Klass.new`;
7.  Add some examples of something class-like using closures;
8.  A natural wait to do flip: `>(__, 100)` -> `(100)>` but how to disambiguate?
    Haskell's `fn` 100 is quite ugly and unintuitive.
9.  JSX? Or stick to JSON like in act or templates like in choo? Allowing React
    can have its perks... Will require a XML parser :/
10. pairs are very useful, why not having them?
	  ```
	  coordinates = (5, 6) //or |5, 6|?
	  ```
	  but what is the point, if there's no pattern matching?   
11. Use sanctuary instead of just Ramda? Specifically for the `@` op?