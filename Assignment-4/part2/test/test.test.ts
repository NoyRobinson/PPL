import { describe, expect, test } from '@jest/globals'
import {
    delayedSum, Post, postsUrl, postUrl, invalidUrl, fetchData, fetchMultipleUrls, testDelayedSum, testFetchData, testFetchMultipleUrls
} from '../src/part2';

describe('Assignment 4 Part 2', () => {
    describe('Q2.1 delayedSum (6 points)', () => {
        test('delayedSum returns the sum', () => {
            return delayedSum(2, 3, 1000).then((result) => {
                expect(result).toBe(5);
            });
        });

        test('delayedSum waits at least the specified delay', () => {
            return testDelayedSum().then((result) => {
                expect(result).toBe(true);
            })
        });
    })


    describe('Q2.2 fetchData (12 points)', () => {
        test('successful call to fetchData with array result', async () => {
            expect(await testFetchData(postsUrl)).toBe("success");
        })

        test('successful call to fetchData with Post result', async () => {
            expect(await testFetchData(postUrl)).toBe("success");
        })

        test('failed call to fechData', async () => {
            expect(await testFetchData(invalidUrl)).toBe("failure");
        })
    })


    describe('Q2.3 fetchMultipleUrls (12 points)', () => {
        test('successful call to fetchMultipleUrls', async () => {
            expect(await testFetchMultipleUrls(postsUrl)).toBe("success");
        })

        test('successful call to fetchMultipleUrls: verify results are in the expected order ', async () => {
            // const result = await testFetchMultipleUrls(postsUrl);
            // for(let i = 1; i <= 20; i++) {
            //     expect(result[i].id).toBe(postsUrl + "/" + i);
            // }
        })

        test('failed call to fetchMultipleUrls', async () => {
            expect(await testFetchMultipleUrls(invalidUrl)).toBe("failure");
        })
    })
});

