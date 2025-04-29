# 🧬 aitomics
Aitomics is a simple library for interacting with local LLMs (through LM Studio) that provides traceable transformations and basic comparison of LLM outputs with programmatic or manual results. The library is designed to make it easy to work with local LLMs while maintaining transparency in your transformations.

## 📑 Table of Contents
- [Features](#-features)
- [Getting Started](#-getting-started)
  - [Prerequisites](#-prerequisites)
  - [Installation](#-installation)
- [Core Concepts](#-core-concepts)
  - [Callers and Responses](#1--callers-and-responses)
  - [Comparators](#2--comparators)
  - [Utilities](#3--utilities)
    - [YAML-based Prompt Configuration](#-yaml-based-prompt-configuration)
    - [LLM Configuration](#-llm-configuration)
- [Response Structure](#-response-structure)

## ✨ Features
- 🔄 Traceable transformations with linked response history
- 🔍 Basic comparison tools for evaluating LLM outputs
- 🛠️ Simple utility functions for common tasks
- 🔌 Configurable LLM access

## 🚀 Getting Started

### 📋 Prerequisites
- 🖥️ LM Studio running locally
- ⚡ Node.js installed
- 🤖 A local LLM model (defaults to llama-3.2-3b-instruct)

### 📦 Installation
```bash
npm install aitomics
```

## 🎯 Core Concepts

### 1. 📞 Callers and Responses
The library's core functionality revolves around `Callers` and `Responses`. A `Response` acts as a linked list, allowing you to trace multiple transformations while maintaining the history of changes. Here's a basic example:

```js
import { $, _ } from 'aitomics'

// Create an LLM caller
const caller = $("Replace all whitespaces with underscore _ ")

const input = "Some Text String"

// Pass an input, receive a response
const result = await caller.run(input)

// Access the output
console.log(result.output) // Some_Text_String

// Compose multiple callers
const caller2 = _.compose(caller, _.lowerCase)

const result2 = await caller2.run(input)
console.log(result2.output) // some_text_string

// Access previous transformation
const prev_result = result2.input
console.log(prev_result.output) // Some_Text_String
```

For more examples, check out:
- 📚 `examples/SimpleApplication.js` - Basic usage examples
- 🔄 `examples/ComparisonApplication.js` - Simple comparison examples

### 2. ⚖️ Comparators
Aitomics provides basic comparison tools to evaluate LLM outputs. You can use:
- ✅ `EqualComparatorModel` for exact string or list matching
- 📏 `DistanceComparatorModel` for simple agreement (closeness)
- 🤝 `KrippendorffsComparisonModel` for inter-rater reliability (IRR)
- 🤝 `CohensComparisonModel` for inter-rater reliability (IRR)

Here's a basic comparison example:

```js
// Create two different transformations
const caller1 = $("Take all words and make them elements in a JSON array")
const caller2 = $((i) => i.toUpperCase().split(" ")) // A programmatic caller, which just applies a function to the input

const input = "Some Text String"

// Get results from both transformations
const result1 = await caller1.run(input)
const result2 = await caller2.run(input)

// Compare the results
const comparison = result2.compare(result1).run(new EqualComparisonModel())
console.log(comparison) // 0.2 (20% agreement)
```

Both `KrippendorffsComparisonModel` and `DistanceComparatorModel` support custom weight functions to fine-tune the comparison. The weight function allows you to define how different values should be weighted in the comparison, giving you more control over the agreement calculation.

Note that `KrippendorffsComparisonModel` and `CohensComparisonModel` are multi-response comparison models, meaning they can handle multiple responses from different raters, while `EqualComparatorModel` and `DistanceComparatorModel` are designed for pairwise comparisons.

For more comparison examples, see:
- 📊 `examples/DistanceComparisonExample.js` - Using distance-based comparisons
- 🔄 `examples/KrippendorffsComparisonExample.js` - Using Krippendorff's alpha
- 🤝 `examples/CohensComparisonExample.js` - Using Cohen's kappa

### 3. 🛠️ Utilities

#### 📝 YAML-based Prompt Configuration
You can structure your prompts using YAML files:

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

Usage:
```js
import { parseCategorizationPromptFromYML } from 'aitomics'
parseCategorizationPromptFromYML("filename.yml")
```

The default prompt template is a simple transformation that:
1. Takes the descriptions as individual context messages
2. Maps labels to strings
3. Adds a sentence about the default value

You can override this template using `setPromptTemplate`. The template function should have the signature:
```js
(descriptions: string[], values: {label: string, description: string}[], default_value: string) => string[]
```

Example of overriding the template:
```js
import { setPromptTemplate } from 'aitomics'

setPromptTemplate((descriptions, values, default_value) => [
  "Please categorize the following text:",
  ...descriptions,
  "Available categories:",
  ...values.map(v => `- ${v.label}: ${v.description}`),
  `If none of the above categories fit, use: ${default_value}`
])
```

#### 🔌 LLM Configuration
By default, aitomics uses `./src/util/fetch/default_config.yml` for LLM settings. You can override this by:

```js
import { setConfigFromFile, setConfigFromObject } from 'aitomics'

// Using a file
setConfigFromFile("./config.yml")

// Or using an object
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

## 📋 Response Structure
All responses follow this structure:
```js
{
  output: String | Object,
  caller: Caller,
  input: String | Response,
  generator: generatingType, // INPUT, PROGRAMMATIC, CUSTOM
  root: boolean,
  level: number
}
```
