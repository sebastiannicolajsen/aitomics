# aitomics
Aitomics are a simple set of constructs made to interact with LLMs run locally (through LM Studio). They provide traceable transformations and easy comparison of LLM and programmatic / manual agreement. Ensure that the configuration is properly set and model installed. It defaults to the one in `./src/util/fetch/default_config.yml`, but can be overriden, see [further down](#configuring-llm-access).

*This is mostly made for my personal use, but perhaps others can find value in similar atomic operations to brainstorm and produce traceable results/transformations when working with local LLMs*

## Getting started

The library primarily introduces three different constructs:
- [Callers and responses](#callers-and-responses)
- [Comparators](#comparators)

Further, [we provide some utility functionality](#utilities)

### Callers and Responses

The basic functionality of the library lies in its reuse of `Response` (as a linked list) to be able to trace multiple transformations (made by `Callers`) while allowing to simply apply transformations on the responses. The example is also located in `/examples/SimpleApplication.js`.

```js
import { $, _ } from 'aitomics'

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

Further, `Response` allows you to access the specific `Caller` used and much more (see `/src/response/response.js`). While you can utilize `$` to construct Callers, you can also do so manually (in addition, `$()` yields an identity caller, producing a `Response` with same input/output). It may also make sense to manually construct `Responses` when needing to migrate to the system (and to apply the `Comparators` described below). See the full details of `Responses` [here](#overview-of-response)

### Comparators

From two `Responses` we can also generate a comparison, currently we can use `EqualComparatorModel` to determine agreement in strings or lists, or `DistanceComparatorModel` to determine more flexible agreement (closeness). See individual files (`/src/comparators/models`) for more details. Below is an example of applying the `EqualComparatorModel` (Example also located in `/examples/ComparisonApplication.js`).

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

More functionality lies in the comparators, e.g., `match` allowing you to match two sets of responses and generate multiple comparators at once (see `/src/comparators/comparator.js` and `/src/comparators/models/` )

### Utilities

While you can simply read files as plain text and create `Callers`, aitomics also allows you to read yml files of a certain format using:

```js
import { parseCategorizationPromptFromYML } from 'aitomics'

parseCategorizationPromptFromYML("filename.yml")
```

From this, you can structure prompts as follows for categorisation tasks:

```yml
prompt:
    description:
        - multiple lines of prompt content
        - can go here
    values:
        - label: myLabel
          description: a description of the label
        - label: otherLabel
          description: another description of label
    default_value: unknown
```


This will be parsed by the default `template` parser, which can be overriden using `setPromptTemplate`. the template is any function `(descriptions, values, default_value)` (where values are objects with attributes `label` and `description`). Per default, the prompt template is a quite simply transformation with few additions:

```js
// produces descriptions as individual context messages, and maps labels to strings, while adding a sentence about the default value.
[
  ...descriptions,
  ...values.map((v) => `'${v.label}': ${v.descriptions}`),
  `If nothing is applicable only return the value '${default_value}'`,
]
```


### Configuring LLM access
By default aitomic operations apply `./src/util/fetch/default_config.yml` to determine where to request LLM calls. The settings look like the following, expecting a `llama-3.2-3b-instruct model`:

```yml
model: llama-3.2-3b-instruct
path: http://127.0.0.1
port: 1234
endpoint: v1/chat/completions
settings:
  temperature: 0.7
  max_tokens: -1
  stream: false
```

You can override this by creating a similar config file in your project and update the internal config. You can also update the config via an object. Both approaches are illustrated here:

```js

import { setConfigFromFile, setConfigFromObject } from 'aitomics'
...
setConfigFromFile("./<your configuration file>.yml")
...

const config = {
    model: "llama-3.2-3b-instruct",
    path: "https://127.0.01",
    port: 1234,
    endpoint: "v1/chat/completions",
    settings: {
        temperature: 0.7,
        max_tokens: -1,
        stream: false
    }
}

setConfigFromObject(config)

```


### Overview of Response

All responses are of the following structure:

```js
{
  output: String | Object,
  caller: Caller,
  input: String | Response,
  generator: generatingType, // INPUT, PROGRAMMATIC, CUSTOM
  root: boolean,
  level: number
}
```