import { $, _, EqualComparisonModel } from "../src/index.js"

// Create a caller which afterwards turn the output into a JSON object
let caller = $("Take all words and make them elements in a JSON array. Only return the JSON array");
let composed = _.compose(caller, _.stringToJSON)

const input = "Some Text String"

let result = await composed.run(input)

console.log(result.output) // [ 'Some', 'Text', 'String']

// Create a caller which does this using functions, but also turns the string into uppercase:
const fun = $((i) => i.toUpperCase().split(" "))

const result2 = await fun.run(input)
console.log(result2.output) // ['SOME', 'TEXT', 'STRING']

// Now compare the two results:
let comp = result2.compare(result)
// Using here, an EqualsComparison (i.e., all elements must match)
let comparison = comp.run(new EqualComparisonModel())
console.log(comparison) // 0

// Now recreate LLM caller where only first word is turned into uppercase:
caller = $("Take all words and make them elements in a JSON array. Only return the JSON array. Make first word all uppercase, rest lower case. ");
composed = _.compose(caller, _.stringToJSON)

result = await composed.run(input)
console.log(result.output) // ['SOME', 'Text', 'String']

// repeat comparison:
comp = result2.compare(result)
comparison = comp.run(new EqualComparisonModel())
// Given that there are a total of 6 elements, but only agreement with a single one, meaning there's four disagreements, we get 0.2 (a fifth agreement)
console.log(comparison) // 0.2

