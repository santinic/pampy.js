"use strict";

class PadValueType {}
class UnderscoreType {}
class StringType {}
class NumberType {}
class HeadType {}
class TailType {}

const PAD_VALUE = new PadValueType();
const _ = new UnderscoreType();
const ANY = _;
const STRING = new StringType();
const NUMBER = new NumberType();
const HEAD = new HeadType();
const TAIL = new TailType();
const REST = TAIL;


function isValue(x) {
    if (x === null || x === undefined) return true;
    const t = typeof(x);
    return t === 'number' || t === 'string' || t === 'boolean';
}


function isObject(x) {
    return x instanceof Object && !Array.isArray(x) && !isValue(x);
}


function run(action, x) {
    if (isValue(action)) {
        return action;
    }
    else if (action instanceof Function) {
        return action.apply(null, x);
    }
    else {
        throw new MatchError(`Unsupported action type ${typeof(action)} of action ${action}.`)
    }
}


function matchValue(patt, value) {
    if(patt === '_') {
        // Behaves like UnderscoreType
        return [true, [value]];
    }
    else if (isValue(patt)) {
        return [patt === value, []]
    }
    else if (patt === PAD_VALUE) {
        return [false, []];
    }
    else if (patt === STRING) {
         let bool = typeof(value) === 'string' || value instanceof String;
         if (bool) return [bool, [value]];
         else return [false, []];
    }
    else if (patt === NUMBER) {
        let bool = typeof(value) === 'number' || value instanceof Number;
        if (bool) return [bool, [value]];
        else return [false, []];
    }
    else if (patt === Array) {
        if (value instanceof Array) {
           return [true, [value]];
        }
        else return [false, []];
    }
    else if (Array.isArray(patt)) {
        return matchArray(patt, value)
    }
    else if (patt === Function) {
        // console.log(`[${patt}] === Function`);
        try {
            if (value instanceof patt)
                return [true, [value]];
            return [false, []];
        }
        catch (err) {}
    }
    else if (patt instanceof Function) {
        // console.log(`[${patt}] instanceof Function`);
        let ret = patt(value);
        if (ret === true) return [true, [value]];
        else return [false, []];
    }
    else if (patt === _) {
        return [true, [value]];
    }
    else if (isObject(patt)) {
        return matchDict(patt, value);
    }
    else {
        throw new MatchError(`Pattern ${patt} has unsupported type ${typeof(patt)}.`);
    }
    return [false, []];
}


function matchArray(patt, value) {
    if (!(patt instanceof Array) || !(value instanceof Array)) {
        return [false, []];
    }
    let totalExtracted = [];
    const pairs = zipLongest(patt, value);
    for (let i = 0; i < pairs.length; i++) {
        const [pi, vi] = pairs[i];

        if (pi === TAIL) {
            if (!onlyPadValuesFollow(pairs, i + 1)) {
                throw new MatchError("TAIL/REST must be the last element of a pattern.");
            }
            else {
                totalExtracted = totalExtracted.concat([value.slice(i)]);
                break;
            }
        }
        else {
            let [matched, extracted] = matchValue(pi, vi);
            if (!matched) {
                return [false, []];
            }
            else totalExtracted = totalExtracted.concat(extracted);
        }

    }
    return [true, totalExtracted];
}


function keysSet(x) {
    let set = {};
    for (let key in x) {
        set[key] = true;
    }
    return set;
}

function matchDict(patt, value) {
    if (!isObject(patt) || !isObject(value)) {
        return [false, []];
    }
    let totalExtracted = [];
    let stillUsablePatternKeys = keysSet(patt);
    let stillUsableValueKeys = keysSet(value);
    for (let pkey in patt) {
        if (!(pkey in stillUsablePatternKeys)) continue;
        let pval = patt[pkey];
        let matchedLeftAndRight = false;
        for (let vkey in value) {
            if (!(vkey in stillUsableValueKeys)) continue;
            if (!(pkey in stillUsablePatternKeys)) continue;
            let vval = value[vkey];
            let [keyMatched, keyExtracted] = matchValue(pkey, vkey);
            if (keyMatched) {
                let [valMatched, valExtracted] = matchValue(pval, vval);
                if (valMatched) {
                    delete stillUsablePatternKeys[pkey];
                    delete stillUsableValueKeys[vkey];
                    totalExtracted = totalExtracted.concat(keyExtracted, valExtracted);
                    matchedLeftAndRight = true;
                }
            }
        }
        if (!matchedLeftAndRight)
            return [false,  []];
    }
    return [true, totalExtracted];
}

function pairwise(args) {
    let res = [];
    for (let i = 0; i < args.length; i+=2) {
        res.push([args[i], args[i + 1]]);
    }
    return res;
}

function onlyPadValuesFollow(pairs, i) {
    for (; i < pairs.length; i++) {
        if (pairs[i][0] !== PAD_VALUE) {
            return false;
        }
    }
    return true;
}

function match(x) {
    const args = [...arguments].slice(1);
    if (args.length % 2 !== 0) {
        throw new MatchError("Even number of pattern-action pairs. Every pattern should have an action.");
    }

    let pairs = pairwise(args);

    for (let i = 0; i < pairs.length; i++) {
        let [patt, action] = pairs[i];

        let [matched, extracted] = matchValue(patt, x);
        if (matched) {
            return run(action, extracted);
        }
    }
    throw new MatchError(`No _ provided, case ${x} not handled.`);
}

function matchAll(rows) {
    let total = [];
    for(let i=0; i < rows.length; i++) {
        let row = rows[i];
        let pairs = [...arguments].slice(1);
        let res = match.apply(null, [row].concat(pairs));
        total.push(res);
    }
    return total;
}

function zipLongest(a, b) {
    let maxLen = Math.max(a.length, b.length);
    let res = [];
    for (let i = 0; i < maxLen; i++) {
        let ai = a[i] !== undefined ? a[i] : PAD_VALUE;
        let bi = b[i] !== undefined ? b[i] : PAD_VALUE;
        res.push([ai, bi]);
    }
    return res;
}

class MatchError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MatchError';
    }
}

module.exports = {
    matchValue,
    matchArray,
    matchDict,
    match,
    matchAll,
    zipLongest,
    PAD_VALUE,
    STRING,
    NUMBER,
    _,
    ANY,
    HEAD,
    TAIL,
    REST
};
