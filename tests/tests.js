"use strict";

let assert = require('chai').assert;
let {matchArray, matchValue, matchDict, zipLongest, match, _, HEAD, TAIL, REST,} = require('../lib/pampy');
let {PAD_VALUE, STRING, NUMBER} = require('../lib/pampy');


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
        assert.deepEqual(matchValue(STRING, "ok"), [true, ["ok"]]);
        assert.deepEqual(matchValue(STRING, 3), [false, []]);
        assert.deepEqual(matchValue(NUMBER, 3), [true, [3]]);
        assert.deepEqual(matchValue(NUMBER, "ok"), [false, []]);
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

        assert.deepEqual(matchArray([1, NUMBER, 3], [1, 2, 3]), [true, [2]]);
        assert.deepEqual(matchArray([1, STRING, NUMBER], [1, "2", 3]), [true, ["2", 3]]);
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
        // assert.deepEqual(matchDict({a: STRING, _: _}, {a: 1, b: 2}), [true, [1, 'b', 2]]);
    });
});
describe('match', () => {
    it('lambda args', () => {
        assert.equal(match(3, NUMBER, (x) => x), 3);
        assert.equal(match([1, 2], [1, _], (x) => x), 2);
        assert.equal(match([1, 2, 3], [_, 2, 3], (x) => x), 1);
        assert.deepEqual(match([1, 2, 3], [_, _, 3], (a, b) => [a, b]), [1, 2]);
    });
    it('lambda args TAIL', () => {
        assert.deepEqual(match([1, 2, 3, 4], [1, _, TAIL], (x, tail) => tail), [3, 4]);
        assert.deepEqual(match([1, 2, 3, 4], [1, _, TAIL], (a, b) => [a, b]), [2, [3, 4]]);

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
});