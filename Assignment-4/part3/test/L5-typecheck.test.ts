import { isTypedArray } from 'util/types';
import { isProgram, makeBoolExp, makeIfExp, makeStrExp, parseL5, parseL5Exp, Program } from '../src/L5/L5-ast';
import { typeofProgram, L5typeof, checkCompatibleType, makeUnion, L5ProgType } from '../src/L5/L5-typecheck';
import { applyTEnv } from '../src/L5/TEnv';
import { isNumTExp, isProcTExp, makeBoolTExp, makeNumTExp, makeProcTExp, makeTVar, 
         makeVoidTExp, parseTE, unparseTExp, TExp, isTExp, makeUnionTExp, makeStrTExp } from '../src/L5/TExp';
import { makeOk, isOkT, bind, mapv, isFailure, Result, makeFailure } from '../src/shared/result';

describe('L5 Type Checker', () => {
    describe('parseTE', () => {
        it('parses atoms', () => {
            expect(parseTE("number")).toEqual(makeOk(makeNumTExp()));
            expect(parseTE("boolean")).toEqual(makeOk(makeBoolTExp()));
        });

        it('parses type variables', () => {
            expect(parseTE("T1")).toEqual(makeOk(makeTVar("T1")));
        });

        it('parses procedures', () => {
            expect(parseTE("(number -> (number -> number))")).toEqual(
                makeOk(makeProcTExp([makeNumTExp()], makeProcTExp([makeNumTExp()], makeNumTExp())))
            );
        });

        it('parses "void" and "Empty"', () => {
            expect(parseTE("void")).toEqual(makeOk(makeVoidTExp()));
            expect(parseTE("(Empty -> void)")).toEqual(makeOk(makeProcTExp([], makeVoidTExp())));
        });
    });

    describe('unparseTExp', () => {
        it('unparses atoms', () => {
            expect(unparseTExp(makeNumTExp())).toEqual(makeOk("number"));
            expect(unparseTExp(makeBoolTExp())).toEqual(makeOk("boolean"));
        });

        it('unparses type variables', () => {
            expect(unparseTExp(makeTVar("T1"))).toEqual(makeOk("T1"));
        });

        it('unparses procedures', () => {
            expect(unparseTExp(makeProcTExp([makeTVar("T"), makeTVar("T")], makeBoolTExp()))).toEqual(makeOk("(T * T -> boolean)"));
            expect(unparseTExp(makeProcTExp([makeNumTExp()], makeProcTExp([makeNumTExp()], makeNumTExp())))).toEqual(makeOk("(number -> (number -> number))"));
        });
    });

    describe('L5typeof', () => {
        it('returns the types of atoms', () => {
            expect(L5typeof("5")).toEqual(makeOk("number"));
            expect(L5typeof("#t")).toEqual(makeOk("boolean"));
        });

        it('returns the type of primitive procedures', () => {
            expect(L5typeof("+")).toEqual(makeOk("(number * number -> number)"));
            expect(L5typeof("-")).toEqual(makeOk("(number * number -> number)"));
            expect(L5typeof("*")).toEqual(makeOk("(number * number -> number)"));
            expect(L5typeof("/")).toEqual(makeOk("(number * number -> number)"));
            expect(L5typeof("=")).toEqual(makeOk("(number * number -> boolean)"));
            expect(L5typeof("<")).toEqual(makeOk("(number * number -> boolean)"));
            expect(L5typeof(">")).toEqual(makeOk("(number * number -> boolean)"));
            expect(L5typeof("not")).toEqual(makeOk("(boolean -> boolean)"));
        });

        it("returns the type of primitive op applications", () => {
            expect(L5typeof("(+ 1 2)")).toEqual(makeOk("number"));
            expect(L5typeof("(- 1 2)")).toEqual(makeOk("number"));
            expect(L5typeof("(* 1 2)")).toEqual(makeOk("number"));
            expect(L5typeof("(/ 1 2)")).toEqual(makeOk("number"));

            expect(L5typeof("(= 1 2)")).toEqual(makeOk("boolean"));
            expect(L5typeof("(< 1 2)")).toEqual(makeOk("boolean"));
            expect(L5typeof("(> 1 2)")).toEqual(makeOk("boolean"));

            expect(L5typeof("(not (< 1 2))")).toEqual(makeOk("boolean"));
        });

        it.skip('type checking of generic functions is not supported', () => {
            // All of these fail in TypeCheck because we do not support generic functions
            // They do work in Type Inference.
            expect(L5typeof("(eq? 1 2)")).toEqual(makeOk("boolean"));
            expect(L5typeof('(string=? "a" "b")')).toEqual(makeOk("boolean"));
            expect(L5typeof('(number? 1)')).toEqual(makeOk("boolean"));
            expect(L5typeof('(boolean? "a")')).toEqual(makeOk("boolean"));
            expect(L5typeof('(string? "a")')).toEqual(makeOk("boolean"));
            expect(L5typeof('(symbol? "a")')).toEqual(makeOk("boolean"));
            expect(L5typeof('(list? "a")')).toEqual(makeOk("boolean"));
            expect(L5typeof('(pair? "a")')).toEqual(makeOk("boolean"));
        });

        it('returns the type of "if" expressions', () => {
            expect(L5typeof("(if (> 1 2) 1 2)")).toEqual(makeOk("number"));
            expect(L5typeof("(if (= 1 2) #t #f)")).toEqual(makeOk("boolean"));
        });

        it('returns the type of procedures', () => {
            expect(L5typeof("(lambda ((x : number)) : number x)")).toEqual(makeOk("(number -> number)"));
            expect(L5typeof("(lambda ((x : number)) : boolean (> x 1))")).toEqual(makeOk("(number -> boolean)"));
            expect(L5typeof("(lambda((x : number)) : (number -> number) (lambda((y : number)) : number (* y x)))")).toEqual(makeOk("(number -> (number -> number))"));
            expect(L5typeof("(lambda((f : (number -> number))) : number (f 2))")).toEqual(makeOk("((number -> number) -> number)"));
            expect(L5typeof("(lambda((x : number)) : number (let (((y : number) x)) (+ x y)))")).toEqual(makeOk("(number -> number)"));
        });

        it('returns the type of "let" expressions', () => {
            expect(L5typeof("(let (((x : number) 1)) (* x 2))")).toEqual(makeOk("number"));
            expect(L5typeof("(let (((x : number) 1) ((y : number) 3)) (+ x y))")).toEqual(makeOk("number"));
            expect(L5typeof("(let (((x : number) 1) ((y : number) 2)) (lambda((a : number)) : number (+ (* x a) y)))")).toEqual(makeOk("(number -> number)"));
        });

        it('returns the type of "letrec" expressions', () => {
            expect(L5typeof("(letrec (((p1 : (number -> number)) (lambda((x : number)) : number (* x x)))) p1)")).toEqual(makeOk("(number -> number)"));
            expect(L5typeof("(letrec (((p1 : (number -> number)) (lambda((x : number)) : number (* x x)))) (p1 2))")).toEqual(makeOk("number"));
            expect(L5typeof(`
                (letrec (((odd? : (number -> boolean)) (lambda((n : number)) : boolean (if (= n 0) #f (even? (- n 1)))))
                         ((even? : (number -> boolean)) (lambda((n : number)) : boolean (if (= n 0) #t (odd? (- n 1))))))
                  (odd? 12))`)).toEqual(makeOk("boolean"));
        });

        it('returns "void" as the type of "define" expressions', () => {
            expect(L5typeof("(define (foo : number) 5)")).toEqual(makeOk("void"));
            expect(L5typeof("(define (foo : (number * number -> number)) (lambda((x : number) (y : number)) : number (+ x y)))")).toEqual(makeOk("void"));
            expect(L5typeof("(define (x : (Empty -> number)) (lambda () : number 1))")).toEqual(makeOk("void"));
        });

        it.skip('returns "literal" as the type for literal expressions', () => {
            expect(L5typeof("(quote ())")).toEqual(makeOk("literal"));
        });
	});

    // TODO L51 Typecheck program with define
    describe('L5 Typecheck program with define', () => {
        // TODO L51
        expect(L5ProgType("(L5 (define (foo : boolean) 5))")).toEqual(makeFailure("Incompatible types: boolean and number in (define (foo : boolean) 5)"));
        expect(L5ProgType("(L5 (define (foo : number) 5))")).toEqual(makeOk("void"));
    });

    // TODO L51 Test checkCompatibleType with unions
    describe('L5 Test checkCompatibleType with unions', () => {
        // TODO L51
        expect(checkCompatibleType(makeBoolTExp(), makeUnionTExp([makeBoolTExp(), makeStrTExp()]), 
            makeIfExp(makeBoolExp(true), makeBoolExp(false), makeStrExp("")))).toEqual(makeOk(true));

        expect(checkCompatibleType(makeBoolTExp(), makeUnionTExp([makeNumTExp(), makeStrTExp()]), 
            makeIfExp(makeBoolExp(true), makeBoolExp(false), makeStrExp("")))).toEqual(
                makeFailure("Incompatible types: boolean and (union number string) in (if #t #f \"\")"));

        expect(checkCompatibleType(makeUnionTExp([makeBoolTExp(), makeStrTExp()]), makeUnionTExp([makeBoolTExp(), makeStrTExp()]), 
            makeIfExp(makeBoolExp(true), makeBoolExp(false), makeStrExp(
                "Incompatible types: boolean and (union string number) in (if #t #f \"\")")))).toEqual(makeOk(true));

        expect(checkCompatibleType(makeUnionTExp([makeBoolTExp(), makeStrTExp(), makeNumTExp()]), makeUnionTExp([makeBoolTExp(), makeStrTExp()]), 
            makeIfExp(makeBoolExp(true), makeBoolExp(false), makeStrExp("")))).toEqual(makeFailure(
                "Incompatible types: (union boolean (union number string)) and (union boolean string) in (if #t #f \"\")"));
    });

    // TODO L51 Test makeUnion
    describe('L5 Test makeUnion', () => {
        // TODO L51
        //makeUnion( number, boolean) -> union((number, boolean))
        expect(makeUnion(makeNumTExp(), makeBoolTExp())).toEqual(makeUnionTExp
            ([makeBoolTExp(), makeNumTExp()]));

        // makeUnion( union(number, boolean), string) -> union(boolean, number, string)
        expect(makeUnion(makeUnionTExp([makeNumTExp(), makeBoolTExp()]), makeStrTExp())).toEqual(makeUnionTExp([
                makeBoolTExp(), makeNumTExp(), makeStrTExp()]));
        
        // makeUnion( union(number, boolean), union(boolean, string)) -> union(boolean, number, string)
        expect(makeUnion(makeUnionTExp([makeNumTExp(), makeBoolTExp()]), makeUnionTExp([makeBoolTExp(), makeStrTExp()]))).toEqual(
            makeUnionTExp([makeBoolTExp(), makeNumTExp(), makeStrTExp()]));   
        
        // makeUnion( number, union(number, boolean)) -> union(boolean, number)
        expect(makeUnion(makeNumTExp(), makeUnionTExp([makeNumTExp(), makeBoolTExp()]))).toEqual(
            makeUnionTExp([makeBoolTExp(), makeNumTExp()]));
    });
    
    // TODO L51 Test typeOfIf with union in all relevant positions
    describe('L5 Test typeOfIf with union in all relevant positions', () => {
        // typeOfIf( (if #t 1 #t) ) -> union(boolean, number)
        expect(L5typeof("(if #t 1 #t)")).toEqual(makeOk("(union boolean number)"));

        // typeOfIf( (if #t 1 2) ) -> number
        expect(L5typeof("(if #t 1 2)")).toEqual(makeOk("number"));

        // typeOfIf( (if #t (if #f 1 #t) "ok") ) -> union(boolean, number, string)
        expect(L5typeof('(if #t (if #f 1 #t) "ok")')).toEqual(makeOk("(union boolean (union number string))"));

        // typeOfIf( (if 1 2 3) ) -> failure
        expect(L5typeof("(if 1 2 3)")).toEqual(makeFailure("Incompatible types: number and boolean in (if 1 2 3)"));
    });

    // TODO L51 Test checkCompatibleType with unions in arg positions of Procedures
    describe('L5 Test checkCompatibleType with unions in arg positions of Procedures', () => {
        // TODO L51
        // Implement the test for the examples given in the document of the assignment (3.2.4)
        expect(L5ProgType('(L5 (define (h : ((number -> string) -> string)) (lambda ((t : (number -> string))) : string (t 1))) (define (g : (number -> string)) (lambda ((x : number)) : string "G OK")) (h g))')).toEqual(makeOk("string"));
        expect(L5ProgType('(L5 (define (h : ((number -> string) -> string)) (lambda ((t : (number -> string))) : string (t 1))) (define (f : ((union number boolean) -> string)) (lambda ((x : (union number boolean))) : string "F OK")) (h f))')).toEqual(makeOk("string"));        
        expect(L5ProgType('(L5 (define (i : (((union number boolean) -> string) -> string)) (lambda ((t : ((union number boolean) -> string))) : string (t #t))) (define (f : ((union number boolean) -> string)) (lambda ((x : (union number boolean))) : string "F OK")) (i f))')).toEqual(makeOk("string"));
        expect(L5ProgType('(L5 (define (i : (((union number boolean) -> string) -> string)) (lambda ((t : ((union number boolean) -> string))) : string (t #t))) (define (g : (number -> string)) (lambda ((x : number)) : string "G OK")) (i g))')).toEqual(makeFailure("∀i ∈ [1 . . . n1], p2,i !⊆ p1,i"));
    });
});
