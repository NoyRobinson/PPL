import {  Exp, Program, CExp, ProcExp, LetExp, Cond, IfExp, isNumExp, isBoolExp, isStrExp, isPrimOp, isVarDecl, isVarRef, isLitExp,isAppExp, isIfExp, isProcExp, isLetExp, isCond, makeAppExp, makeIfExp, makeProcExp, makeLetExp, makeCond, isProgram, makeProgram, isDefineExp, makeDefineExp, isCExp, AppExp} from "./L31-ast";
import { Result, makeFailure, makeOk, mapResult, mapv } from "../shared/result";
import { map } from "ramda";
import { rest } from "../shared/list";

/*
Purpose: Transform L31 AST to L3 AST
Signature: l31ToL3(l31AST)
Type: [Exp | Program] => Result<Exp | Program>
*/
export const L31ToL3 = (exp: Exp | Program): Result<Exp | Program> => {
    if(isProgram(exp))
       return mapv(mapResult(defineOrCExp, exp.exps), makeProgram);
    return defineOrCExp(exp);
}

const defineOrCExp = (exp: Exp): Result<Exp> => {
    if(isCExp(exp))
        return makeOk (rewriteAllCond(exp));
    return makeOk(makeDefineExp(exp.var, rewriteAllCond(exp.val))); //DefineExp
}

const rewriteCond = (exp: Cond) : IfExp => {
    if(exp.val.length !== 1) //if its not an else clause
        return makeIfExp(rewriteAllCond(exp.val[0].test), rewriteAllCond(exp.val[0].then), rewriteCond(makeCond(rest(exp.val), exp.else)));
    return makeIfExp(rewriteAllCond(exp.val[0].test), rewriteAllCond(exp.val[0].then), exp.else);
}

const rewriteAllCond = (e: CExp): CExp => {
    if(isNumExp(e) || isBoolExp(e) || isStrExp(e) || isPrimOp(e) || isVarRef(e) || isLitExp(e) || isVarDecl(e))
        return e;
    if(isAppExp(e))
        return buildAppExp(e)
    if(isIfExp(e))
        return buildIfExp(e);
    if(isProcExp(e))
        return buildProcExp(e);
    if(isLetExp(e))
        return buildLetExp(e);
    if(isCond(e))
        return rewriteAllCond(rewriteCond(e));
    return e;
}

const buildAppExp = (appexp: AppExp): AppExp => makeAppExp(rewriteAllCond(appexp.rator), map(rewriteAllCond, appexp.rands));
const buildIfExp = (ifexp: IfExp): IfExp => makeIfExp(rewriteAllCond(ifexp.test), rewriteAllCond(ifexp.then), rewriteAllCond(ifexp.alt));
const buildProcExp = (procexp: ProcExp): ProcExp => makeProcExp(procexp.args, map(rewriteAllCond, procexp.body));
const buildLetExp = (letexp: LetExp): LetExp => makeLetExp(letexp.bindings, map(rewriteAllCond, letexp.body));

