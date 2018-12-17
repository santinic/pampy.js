![Pampy in Star Wars](https://github.com/santinic/pampy.js/raw/master/imgs/pampyjs.png "Pampy in Star Wars")

# Pampy.js: Pattern Matching for JavaScript
[![License MIT](https://go-shields.herokuapp.com/license-MIT-blue.png)]()
[![Travis-CI Status](https://api.travis-ci.org/santinic/pampy.js.svg?branch=master)](https://travis-ci.org/santinic/pampy.js)
[![Coverage Status](https://coveralls.io/repos/github/santinic/pampy.js/badge.svg?branch=master)](https://coveralls.io/github/santinic/pampy.js?branch=master)
[![npm version](https://badge.fury.io/js/pampy.svg)](https://badge.fury.io/js/pampy)


Pampy.js is pretty small (250 lines), reasonably fast, and often makes your code more readable, and easier to reason about. There is also a [Python version](https://github.com/santinic/pampy) of Pampy.

<kbd>
  <img src="https://github.com/santinic/pampy.js/raw/master/imgs/slide1.png" width="700">
</kbd>

## You can write many patterns

Patterns are evaluated in the order they appear.

<kbd>
  <img src="https://github.com/santinic/pampy.js/raw/master/imgs/slide2.png" width="700">
</kbd>


## You can write Fibonacci
The operator _ means "any other case I didn't think of". **If you already use `_`, you can require `ANY`, which is exactly the same**.

```javascript
let {match, _} = require("pampy");

function fib(n) {
    return match(n,
        1, 1,
        2, 1,
        _, (x) => fib(x - 1) + fib(x - 2)
    );
}
```

## You can write a Lisp calculator in 5 lines

```javascript
let {match, REST, _} = require("pampy");

function lisp(exp) {
    return match(exp,
        Function,           (x) => x,
        [Function, REST],   (f, rest) => f.apply(null, rest.map(lisp)),
        Array,              (l) => l.map(lisp),
        _,                  (x) => x
    );
}
let plus = (a, b) => a + b;
let minus = (a, b) => a - b;
let reduce = (f, l) => l.reduce(f);

lisp([plus, 1, 2]);                 // => 3
lisp([plus, 1, [minus, 4, 2]]);     // => 3
lisp([reduce, plus, [1, 2, 3]]);    // => 6
```

## You can match so many things!

```javascript
let {match, _} = require("pampy");

match(x,
    3,                "this matches the number 3",

    Number,           "matches any javascript number",

    [String, Number], (a, b) => "a typed list [a, b] that you can use in a function",

    [1, 2, _],        "any list of 3 elements that begins with [1, 2]",

    {x: _},           "any dict with a key 'x' and any value associated",

    _,                "anything else"
)
```

## You can match TAIL

```javascript
let {match, _, TAIL} = require("pampy");

x = [1, 2, 3];

match(x, [1, TAIL],   (t) => t);            // => [2, 3]

match(x, [_, TAIL],   (h, t) => [h, t]);    // => [1, [2, 3])

```

## You can nest lists and tuples

```javascript
let {match, _, TAIL} = require("pampy");

x = [1, [2, 3], 4];

match(x, [1, [_, 3], _], (a, b) => [1, [a, 3], b]);   // => [1, [2, 3], 4]
```

## You can nest dicts. And you can use _ as key!

```javascript

pet = { type: 'dog', details: { age: 3 } };

match(pet, {details: {age: _}}, (age) => age);        // => 3

match(pet, {_: {age: _}}, (a, b) => [a, b]);          // => ['details', 3]
```
Admittedly using `_` as key is a bit of a trick, but it works for most situations.

## You can use functions as patterns
```javascript 
match(x,
  x => x > 3,     x => `${x} is > 3`,
  x => x < 3,     x => `${x} is < 3`,
  x => x === 3,   x => `${x} is = 3`
)
```

## You can pass [pattern, action] array pairs to matchPairs for better Prettier formatting.

```javascript
function fib(n) {
    return matchPairs(
      n,
      [0, 0],
      [1, 1],
      [2, 1],
      [3, 2],
      [4, 3],
      [_, x => fib(x - 1) + fib(x - 2)]
    )
  }
```

## All the things you can match

| Pattern Example | What it means | Matched Example |  Arguments Passed to function | NOT Matched Example |
| --------------- | --------------| --------------- | ----------------------------- | ------------------ |
| `"hello"` |  only the string `"hello"` matches | `"hello"` | nothing | any other value |
| `Number` | Any javascript number | `2.35` | `2.35` | any other value |
| `String` | Any javascript string | `"hello"` | `"hello"` | any other value |
| `Array` | Any array object | `[1, 2]` | `[1, 2]` | any other value |
| `_` | Any object |  | that value | |
| `ANY` | The same as `_` | | that value | |
| `[1, 2, _]`  | A list that starts with 1, 2 and ends with any value | `[1, 2, 3]` | `3` | `[1, 2, 3, 4]` |
| `[1, 2, TAIL]` | A list that start with 1, 2 and ends with any sequence | `[1, 2, 3, 4]`| `[3, 4]` | `[1, 7, 7, 7]` |
| `{type:'dog', age: _ }` | Any dict with `type: "dog"` and with an age | `{type:"dog", age: 3}` | `3` | `{type:"cat", age:2}` |
| `{type:'dog', age: Number }` | Any dict with `type: "dog"` and with an numeric age | `{type:"dog", age: 3}` | `3` | `{type:"dog", age:2.3}` |
| `x => x > 3` | Anything greather than 3 | `5` | `3` | `2` |
| `null` | only `null` | `null` | nothing | any other value |
| `undefined` | only `undefined` | `undefined` | nothing | any other value |

## How to install
```npm install pampy```
