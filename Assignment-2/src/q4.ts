
import { map } from "ramda";
import { Result, makeFailure, makeOk, bind, mapResult } from '../shared/result';
import { isProgram, isDefineExp, isNumExp, isBoolExp, isPrimOp, isVarRef, isAppExp, isIfExp, isProcExp, isStrExp, DefineExp, AppExp, IfExp, ProcExp, CExp, PrimOp, Exp, Program } from "./L31-ast";

/*
Purpose: Transform L2 AST to Python program string
Signature: l2ToPython(l2AST)
Type: [Parsed | Error] => Result<string>
*/
export const l2ToPython = (exp: Exp | Program): Result<string>  => 
    isProgram(exp) ? buildIsProgram(exp) :
    isDefineExp(exp) ? buildIsDefine(exp) :
    isNumExp(exp) ? makeOk(exp.val.toString()) :
    isBoolExp(exp) ? makeOk(exp.val ? 'True' : 'False') :
    isStrExp(exp) ? makeOk(exp.val) :
    isPrimOp(exp) ? makeOk(primitiveOperators(exp.op)) :
    isVarRef(exp) ? makeOk(exp.var) :
    isIfExp(exp) ? buildIsIf(exp) :
    isProcExp(exp) ? buildIsProc(exp) :
    isAppExp(exp) ? buildIsApp(exp) :
    makeFailure("non of the above");

const buildIsProgram = (exp: Program): Result<string> => 
    bind(mapResult(l2ToPython, exp.exps), exps => makeOk(exps.join("\n")));

const buildIsDefine = (exp: DefineExp): Result<string> => 
    bind(l2ToPython(exp.val), val => makeOk(`${exp.var.var} = ${val}`));

const buildIsIf = (exp: IfExp) : Result<string> =>{
    const makeTest = () => l2ToPython(exp.test);
    const makeThen = () => l2ToPython(exp.then);
    const makeAlt = () => l2ToPython(exp.alt);
    return safe3((test: string, then: string, alt: string) => makeOk(`(${then} if ${test} else ${alt})`))(makeTest(), makeThen(), makeAlt());
}

const buildIsProc = (exp: ProcExp) : Result<string> =>
    bind(l2ToPython(exp.body[exp.body.length-1]), body => makeOk(`(lambda ${map((p) => p.var, exp.args).join(",")} : ${body})`));

const buildIsApp = (exp: AppExp) : Result<string> =>
    isPrimOp(exp.rator) ? applicationOfPrimitiveOp(exp.rator, exp.rands) : 
    bind(l2ToPython(exp.rator),rator => bind(mapResult(l2ToPython, exp.rands),rands => makeOk(`${rator}(${rands.join(",")})`)));

const primitiveOperators = (primOp: string): string => {
    if(primOp === "number?")
        return "(lambda x : (type(x) == int) or (type(x) == float))";
    if(primOp === "boolean?")
        return "(lambda x : (type(x) == bool))";
    if(primOp === "=" || primOp === "eq?")    
        return "==";
    return primOp;
}

const applicationOfPrimitiveOp = (rator : PrimOp, rands : CExp[]) : Result<string> => {
    const notExp = () => bind(l2ToPython(rands[0]), rand => makeOk(`(not ${rand})`));
    const numExpOrBooleanExp = () => bind(l2ToPython(rands[0]), rand => makeOk(`${primitiveOperators(rator.op)}(${rand})`));
    const otherExp = () => bind(mapResult(l2ToPython, rands), rands => makeOk(`(${rands.join(` ${primitiveOperators(rator.op)} `)})`));
    if(rator.op === "not")
        return notExp();
    if(rator.op === "number?" || rator.op === "boolean?")
        return numExpOrBooleanExp();
    return otherExp();
}

//taken from shared/result from function safe2 with an addition  
const safe3 = <T1, T2, T3, T4>(f: (x: T1, y: T2, z: T3) => Result<T4>): (xr: Result<T1>, yr: Result<T2>, zr: Result<T3>) => Result<T4> =>
    (xr: Result<T1>, yr: Result<T2>, zr: Result<T3>) => bind(xr, (x: T1) => bind(yr, (y: T2) => bind(zr, (z: T3) => f(x, y, z))));