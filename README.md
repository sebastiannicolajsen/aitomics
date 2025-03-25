# aitomics
AI atomic operations in Javascript for programmatic tasks.


## Getting started

Aitomics are made to work with local LLMs run (through LM Studio). Ensure that the configuration is properly set and model installed (defaults to the one in `./src/util/fetch/default_config.yml`, but can be overriden, see further down).

### Callers and responses

The basic functionality of the library lies in its reuse of `Response` to be able to trace multiple transformations (made by `Callers`):

```js
import { $, _ } from "../src/index.js"

// create an LLM caller
const caller = $("Replace all whitespaces with underscore _ ")

const input = "Some Text String"

// pass an input, receive a response
const result = await caller.run(input)

// access the output
console.log(result.output) // Some_Text_String

// compose multiple callers, using standard library ones: 

const caller2 = _.compose(caller, _.lowerCase)

const result2 = await caller2.run(input)
console.log(result2.output) // some_text_string

// result2 now contains all transformation applied from initial input, i.e., we can access the older one as such
const prev_result = result2.input
console.log(prev_result.output) // Some_Text_String

// we can also use functions instead of LLM calls and retain the same response structure:

const upperCase = $((a) => a.toUpperCase())
const result3 = await upperCase.run(result2)
console.log(result3.output) // SOME_TEXT_STRING
```

### Comparators

From two `Responses` we can also generate a comparison, currently we can use `EqualComparatorModel` or `DistanceComparatorModel` (see individual files):

```js
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
```


### Configuring llm access