import { $, _ } from "../src/index.js"
import { Response } from "../src/index.js"

// create an LLM caller
const caller = $("Replace all whitespaces with underscore _ ")

const input = "Some Text String"

// pass an input, receive a response
const result = await caller.run(input)

// access the output
console.log(result.output) // Some_Text_String

// compose multiple callers, using standard library ones: 

const caller2 = _.compose(caller,_.lowerCase)

const result2 = await caller2.run(input)
console.log(result2.output) // some_text_string

// result2 now contains all transformation applied from initial input, i.e., we can access the older one as such
const prev_result = result2.input
console.log(prev_result.output) // Some_Text_String

// we can also use functions instead of LLM calls and retain the same response structure:

const upperCase = $((a) => a.toUpperCase())
const result3 = await upperCase.run(result2)
console.log(result3.output) // SOME_TEXT_STRING

// Create a response from external data
const externalResponse = Response.create(
  "Data from external source",  // output
  "Original input"             // input (which is needed if we want to compare the response with other responses, i.e., response inputs needs to match to compare)
)

// The response has the same structure as those created by callers
console.log(externalResponse.output) // Data from external source
console.log(externalResponse.generator) // CUSTOM

// You can use it in comparisons or further transformations
const result4 = await upperCase.run(externalResponse)
console.log(result4.output) // DATA FROM EXTERNAL SOURCE

