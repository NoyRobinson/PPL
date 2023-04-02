import { Result, makeFailure, makeOk, bind, either } from "../lib/result";
import * as R from "ramda";

/* Library code */
const findOrThrow = <T>(pred: (x: T) => boolean, a: T[]): T => {
    for (let i = 0; i < a.length; i++) {
        if (pred(a[i])) return a[i];
    }
    throw "No element found.";
}

export const findResult = <T>(pred: (x:T) => boolean, arr: T[]): Result<T> =>
    (R.filter(pred, arr).length === 0) ? makeFailure("no such element exists"): 
    makeOk(R.filter(pred, arr)[0]);

/* Client code */
const returnSquaredIfFoundEven_v1 = (a: number[]): number => {
    try {
        const x = findOrThrow(x => x % 2 === 0, a);
        return x * x;
    } catch (e) {
        return -1;
    }
}

export const returnSquaredIfFoundEven_v2 = (arr: number[]): Result<number> =>
    bind((findResult(x => x % 2 === 0, arr)), (x => makeOk(x * x)));

export const returnSquaredIfFoundEven_v3 = (arr: number[]): number =>
    either((findResult(x => x % 2 === 0, arr)), x => x * x, x => -1);