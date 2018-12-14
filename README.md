![Pampy in Star Wars](https://github.com/santinic/pampy.js/raw/master/imgs/pampyjs.png "Pampy in Star Wars")

# Pampy.js: Pattern Matching for JavaScript
[![License MIT](https://go-shields.herokuapp.com/license-MIT-blue.png)]()
[![Travis-CI Status](https://api.travis-ci.org/santinic/pampy.js.svg?branch=master)](https://travis-ci.org/santinic/pampy.js)


Pampy.js is pretty small (150 lines), reasonably fast, and often makes your code more readable, and easier to reason about. There is also a [Python version](https://github.com/santinic/pampy) of Pampy.

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
        Function, 			(x) => x,
        [Function, REST], 	(f, rest) => f.apply(null, rest.map(lisp)),
        Array, 				(l) => l.map(lisp),
        _, 					(x) => x
    );

let plus = (a, b) => a + b;
let minus = (a, b) => a - b;
let reduce = (f, l) => l.reduce(f);

lisp([plus, 1, 2]);						# => 3
lisp([plus, 1, [minus, 4, 2]]); 		# => 3
lisp([reduce, plus, [1, 2, 3]]); 		# => 6
```

## You can match so many things!

```javascript
let {match, _, NUMBER, STRING} = require("pampy");

match(x,
    3,              	"this matches the number 3",

    NUMBER,            	"matches any javascript number",

    [STRING, NUMBER],	[a, b] => "a typed list [a, b] that you can use in a function",

    [1, 2, _],      	"any list of 3 elements that begins with [1, 2]",

    {x: _},       		"any dict with a key 'x' and any value associated",

    _,              	"anything else"
)
```

## You can match TAIL

```javascript
let {match, _, TAIL} = require("pampy");

x = [1, 2, 3];

match(x, [1, TAIL],    	(t) => t);            # => [2, 3]

match(x, [_, TAIL],  	(h, t) => [h, t]);    # => [1, [2, 3])

```

## You can nest lists and tuples

```javascript
let {match, _, TAIL} = require("pampy");

x = [1, [2, 3], 4];

match(x, [1, [_, 3], _], (a, b) => [1, [a, 3], b]);   # => [1, [2, 3], 4]
```

## You can nest dicts. And you can use _ as key!

```javascript

pet = { type: 'dog', details: { age: 3 } };

match(pet, {details: {age: _}}, (age) => age);        # => 3

match(pet, {_: {age: _}}, (a, b) => [a, b]);          # => ['details', 3]
```

## All the things you can match

| Pattern Example | What it means | Matched Example |  Arguments Passed to function | NOT Matched Example |
| --------------- | --------------| --------------- | ----------------------------- | ------------------ |
| `"hello"` |  only the string `"hello"` matches | `"hello"` | nothing | any other value |
| `None` | only `None` | `None` | nothing | any other value |
| `int` | Any integer | `42` | `42` | any other value |
| `float` | Any float number | `2.35` | `2.35` | any other value |
| `str` | Any string | `"hello"` | `"hello"` | any other value |
| `tuple` | Any tuple | `(1, 2)` | `(1, 2)` | any other value |
| `list` | Any list | `[1, 2]` | `[1, 2]` | any other value |
| `MyClass` | Any instance of MyClass. **And any object that extends MyClass.** | `MyClass()` | that instance | any other object |
| `_` | Any object (even None) |  | that value | |
| `ANY` | The same as `_` | | that value | |
| `(int, int)` | A tuple made of any two integers | `(1, 2)` | `1` and `2` | (True, False) |
| `[1, 2, _]`  | A list that starts with 1, 2 and ends with any value | `[1, 2, 3]` | `3` | `[1, 2, 3, 4]` |
| `[1, 2, TAIL]` | A list that start with 1, 2 and ends with any sequence | `[1, 2, 3, 4]`| `[3, 4]` | `[1, 7, 7, 7]` |
| `{'type':'dog', age: _ }` | Any dict with `type: "dog"` and with an age | `{"type":"dog", "age": 3}` | `3` | `{"type":"cat", "age":2}` |
| `{'type':'dog', age: int }` | Any dict with `type: "dog"` and with an `int` age | `{"type":"dog", "age": 3}` | `3` | `{"type":"dog", "age":2.3}` |
| `re.compile('(\w+)-(\w+)-cat$')` | Any string that matches that regular expression expr | `"my-fuffy-cat"` | `"my"` and `"puffy"` | `"fuffy-dog"` | 


## Install
```npm i pampy```


<!--We could port it also to Python 2 but we'd need to change the dict matching syntax.-->
