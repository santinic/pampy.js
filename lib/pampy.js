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
    let t = typeof(x);
    return t === 'number' || t === 'string' || t === 'boolean' ||
        t === undefined || t === null;
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
    if (isValue(patt)) {
        return [patt === value, []]
    }
    else if (patt instanceof Array) {
        return matchArray(patt, value);
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
    else if (Array.isArray(patt)) {
        return matchArray(patt, value)
    }
    else if (patt === _) {
        return [true, [value]];
    }
    else if (patt instanceof Function) {
        try {
            if (value instanceof patt)
                return [true, [value]];
            return [false, []];
        }
        catch (err) {}
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
    let pairs = zipLongest(patt, value);
    for (let i = 0; i < pairs.length; i++) {
        let [pi, vi] = pairs[i];

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


function pairwise(args) {
    let res = [];
    for (let i = 0; i < args.length; i++) {
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
    let args = [...arguments].slice(1);
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
    match,
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
