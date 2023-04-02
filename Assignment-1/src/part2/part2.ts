import * as R from "ramda";

const stringToArray = R.split("");

/* Question 1 */
export const countLetters: (str: string) => {[key: string]:number} = R.pipe(
    stringToArray, R.filter((char) => char !== " "), R.countBy(R.toLower));

/* Question 2 */
const checkMatch: (arr: string[], str: string) => string[] = (arr: string[], str: string) =>
    (str === "(") ? R.append("(", arr) :
    (str === "[") ? R.append("[", arr) :
    (str === "{") ? R.append("{", arr) :
    (arr.length != 0) ?  
    ((str === ")") && (arr[arr.length-1] == "(") ? R.remove(arr.length-1, 1, arr) :
    (str === "]") && (arr[arr.length-1] == "[") ? R.remove(arr.length-1, 1, arr) :
    (str === "}") && (arr[arr.length-1] == "{") ? R.remove(arr.length-1, 1, arr) : arr) :
    (str === ")" || str === "]" || str === "}") ? ["-1"] : 
    arr;

const isMatch: (array: string[]) => boolean = (array: string[]) => 
    (array[0] == "-1" || array.length != 0) ? false : true;

export const isPaired: (str: string) => boolean = str => isMatch(R.reduce(checkMatch, [], stringToArray(str)));

/* Question 3 */
export type WordTree = {
    root: string;
    children: WordTree[];
}

export const treeToSentence: (tree: WordTree) => string = (tree: WordTree) : string =>
    (tree.children.length !== 0) ? tree.root + " " + tree.children.map(treeToSentence).join(" ") : tree.root;