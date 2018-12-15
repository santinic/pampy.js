"use strict";

let assert = require('chai').assert;
let lodash = require('lodash');
let fs = require('fs');
let {matchArray, matchValue, matchDict, zipLongest, match, matchAll, _, HEAD, TAIL, REST,} = require('../lib/pampy');
let {PAD_VALUE, ANY, MatchError} = require('../lib/pampy');


describe('matchValue', () => {
    it('values', () => {
        assert.deepEqual(matchValue(3, 3), [true, []]);
        assert.deepEqual(matchValue("ok", "ok"), [true, []]);
        assert.deepEqual(matchValue("ok", 3), [false, []]);
        assert.deepEqual(matchValue(true, true), [true, []]);
        assert.deepEqual(matchValue(true, false), [false, []]);
        assert.deepEqual(matchValue(false, false), [true, []]);
        assert.deepEqual(matchValue(3.0, 3), [true, []]);
        assert.deepEqual(matchValue(_, 1), [true, [1]])
    });
    it('types', () => {
        assert.deepEqual(matchValue(String, "ok"), [true, ["ok"]]);
        assert.deepEqual(matchValue(String, 3), [false, []]);
        assert.deepEqual(matchValue(Number, 3), [true, [3]]);
        assert.deepEqual(matchValue(Number, "ok"), [false, []]);
    });
});
describe('matchArray', () => {
    it('zipLongest', () => {
        assert.deepEqual(zipLongest([1, 2, 3], [1, 2]), [[1, 1], [2, 2], [3, PAD_VALUE]]);
        assert.deepEqual(zipLongest([1, 2], [1, 2, 3]), [[1, 1], [2, 2], [PAD_VALUE, 3]]);
        assert.deepEqual(zipLongest([1, 2], [1, 2]), [[1, 1], [2, 2]]);
    });
    it('values', () => {
        assert.deepEqual(matchArray([1, 2, 3], [1, 2, 3]), [true, []]);
        assert.deepEqual(matchArray([1, 2, 3], [1, 2]), [false, []]);
        assert.deepEqual(matchArray([1, 2], [1, 2, 3]), [false, []]);
        assert.deepEqual(matchArray([1, 2, _], [1, 2, 3]), [true, [3]]);
        assert.deepEqual(matchArray([1, _, _], [1, 2, 3]), [true, [2, 3]]);
        assert.deepEqual(matchArray([1, _, 3], [1, 2, 3]), [true, [2]]);

        assert.deepEqual(matchArray([1, Number, 3], [1, 2, 3]), [true, [2]]);
        assert.deepEqual(matchArray([1, String, Number], [1, "2", 3]), [true, ["2", 3]]);
    });
    it('nested', () => {
        assert.deepEqual(matchArray([1, [_, 3], _], [1, [2, 3], 4]), [true, [2, 4]])
    })
});
describe('matchDict', () => {
    it('values', () => {
        assert.deepEqual(matchDict({a: 1, b: 2}, {a: 1, b: 2}), [true, []]);
        assert.deepEqual(matchDict({a: _, b: 2}, {a: 1, b: 2}), [true, [1]]);
        assert.deepEqual(matchDict({a: _, b: 2}, {a: 1}), [false, []]);
    });
    it('dict ordering', () => {
        for(let i=0; i < 100; i++) {
            assert.deepEqual(matchDict({a: _, b: _}, {a: 1, b: 2}), [true, [1, 2]]);
        }
    });
    it('ambiguous double _', () => {
        assert.deepEqual(matchDict({a: _, _: _}, {a: 1, b: 2}), [true, [1, 'b', 2]]);
        assert.deepEqual(matchDict({a: String, _: _}, {a: "1", b: 2}), [true, ["1", 'b', 2]]);
    });
});
describe('match', () => {
    it('bad args num', () => {
        assert.throws(() => match(3, 2), MatchError);
        assert.throws(() => match(4, 3, 4, 5), MatchError);
    });
    it('TAIL/REST position', () => {
        assert.throws(() => match([1,2,3] [TAIL, 1], 1), MatchError);
    });
    it('ignored case', () => {
        assert.throws(() => match(3, String, "ok"), MatchError);
    });
    it('lambda args', () => {
        assert.equal(match(3, Number, (x) => x), 3);
        assert.equal(match([1, 2], [1, _], (x) => x), 2);
        assert.equal(match([1, 2, 3], [_, 2, 3], (x) => x), 1);
        assert.deepEqual(match([1, 2, 3], [_, _, 3], (a, b) => [a, b]), [1, 2]);
    });
    it('lambda args TAIL', () => {
        assert.deepEqual(match([1, 2, 3, 4], [1, _, TAIL], (x, tail) => tail), [3, 4]);
        assert.deepEqual(match([1, 2, 3, 4], [1, _, TAIL], (a, b) => [a, b]), [2, [3, 4]]);

    });
    it('lambda cond', () => {
        function f(x) {
            return match(x,
                String,         x => `${x} is a String`,
                x => x > 3,     x => `${x} is > 3`,
                x => x < 3,     x => `${x} is < 3`,
                x => x === 3,   x => `${x} is = 3`);
        }
        assert.equal(f(3), "3 is = 3");
        assert.equal(f(2), "2 is < 3");
        assert.equal(f(4), "4 is > 3");
        assert.equal(f("hello"), "hello is a String");
        assert.equal(f("3"), "3 is a String");
    });
    it('fibonacci', () => {
        function fib(n) {
            return match(n,
                1, 1,
                2, 1,
                _, (x) => fib(x - 1) + fib(x - 2)
            );
        }

        assert.equal(fib(2), 1);
        assert.equal(fib(7), 13);
    });
    it('lisp', () => {
        function lisp(exp) {
            return match(exp,
                Function, (x) => x,
                [Function, REST], (f, rest) => f.apply(null, rest.map(lisp)),
                Array, (l) => l.map(lisp),
                _, (x) => x
            );
        }

        let plus = (a, b) => a + b;
        let minus = (a, b) => a - b;
        let reduce = (f, l) => l.reduce(f);

        assert.equal(lisp([plus, 1, 2]), 3);
        assert.equal(lisp([plus, 1, [minus, 4, 2]]), 3);
        assert.equal(lisp([reduce, plus, [1, 2, 3]]), 6);
    });
    it('len', () => {
        function len(l) {
            return match(l,
                [],         0,
                [_, TAIL],  (head, tail) => 1 + len(tail)
            )
        }
        assert.equal(len([{}]), 1);
        assert.equal(len([5]), 1);
        assert.equal(len(["1",2,3]), 3);
        assert.equal(len([]), 0);
        assert.equal(len(new Array(100)), 100);
    });
    it('tree leafs', () => {
        function findLeafs(node) {
            return match(node.childs,
                [],         () => node.name,
                [TAIL],     (tail) => lodash.flatMap(tail, findLeafs)
            );
        }

        let tree = {
            name: 1,
            childs: [
                {
                    name: 2,
                    childs: [
                        {name: 3, childs: []},
                        {name: 4, childs: []}
                    ]
                },
                {name:5, childs: []}
            ]
        };
        assert.deepEqual(findLeafs(tree), [3, 4, 5]);
    });
    it('match null and undefined', () => {
        function f(x) {
            return match(x,
                null,       "null",
                undefined,  "undefined",
                Number,     "Number");
        }
        assert.equal(f(3), "Number");
        assert.equal(f(null), "null");
        let z;
        assert.equal(f(z), "undefined");
        assert.equal(f(undefined), "undefined");
    });
});
describe('matchAll', () => {
    it('basic', () => {
        let rows = [
            {a:1, b:2},
            {a:3, b:4},
            {a:5, b:6}
        ];
        assert.deepEqual(matchAll(rows, {a:_, b:_}, (a, b) => [a, b]),  [[1,2],[3,4],[5,6]]);
        assert.deepEqual(matchAll(rows, {a:_, _:_}, (x1, x2, x3) => [x1, x2, x3]),  [[1,"b",2],[3,"b",4],[5,"b",6]]);
    });
    it('Big json', () => {
        let bigJson = JSON.parse(fs.readFileSync("./tests/proggit.json"));

        let res = matchAll(bigJson.data.children, {_: {score: _}}, (key, x) => x);
        assert.equal(res.length, bigJson.data.children.length);

        let avgMatch = res.reduce((a,b) => a + b) / res.length;
        let avg = bigJson.data.children.map(c => c.data.score).reduce((a,b) => a + b) / bigJson.data.children.length;
        assert.equal(avgMatch, avg);
    });
});