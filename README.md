# 🧬 aitomics
Aitomics is a simple library for interacting with local LLMs (through LM Studio) that provides traceable transformations and basic comparison of LLM outputs with programmatic or manual results. The library is designed to make it easy to work with local LLMs while maintaining transparency in your transformations.

## 📑 Table of Contents
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Core Concepts](#core-concepts)
  - [Callers and Responses](#callers-and-responses)
    - [Response Structure](#response-structure)
  - [Comparators](#comparators)
  - [Utilities](#utilities)
    - [YAML-based Prompt Configuration](#yaml-based-prompt-configuration)
    - [LLM Configuration](#llm-configuration)
  - [Visualization](#visualization)

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
The library's core functionality revolves around `Callers` and `Responses`. A `Response` acts as a linked list, allowing you to trace multiple transformations while maintaining the history of changes. Here's a basic example (where we explicitly name the caller):

```js
import { $, _ } from 'aitomics'

// Create an LLM caller
const caller = $("Replace all whitespaces with underscore _ ", "whitespace-replacer-1")

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

Each caller must have a unique ID. If no label is provided, a hash is generated automatically. However, if you create multiple callers with the same functionality, you must provide unique labels to avoid conflicts. Different functionality callers can exist without labels, but duplicate unlabeled callers will throw an error. The label is also used for visualization purposes, helping to create clear and descriptive representations of the transformation pipeline as described in the [Visualization](#visualization) section.

The example is detailed further under 📚 [`examples/SimpleApplication.js`](examples/SimpleApplication.js) 

#### Response Structure
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

### 2. ⚖️ Comparators
Aitomics provides basic comparison tools to evaluate LLM outputs. You can use:
- ✅ `EqualComparatorModel` for exact string or list matching
- 📏 `DistanceComparatorModel` for simple agreement (closeness)
- 🤝 `KrippendorffsComparisonModel` for inter-rater reliability (IRR) with single label 
- 🤝 `CohensComparisonModel` for inter-rater reliability (IRR) with multiple labels, also supports multiple reviewer labels

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

Note that `CohensComparisonModel` and `KrippendorffsComparisonModel` are multi-response comparison models, meaning they can handle multiple responses from different raters.

**Krippendorff's Alpha Handling:** The `KrippendorffsComparisonModel` uses a hybrid approach:
*   For **single-label data** (like numeric scores or single categories), it applies the standard Krippendorff's calculation and respects the provided `weightFn` for nuanced agreement.
*   For **multi-label data** (where reviewers provide arrays of labels), it calculates observed agreement using the Jaccard index between label sets, providing a more structurally appropriate measure. In this multi-label mode, the `weightFn` is ignored, and the expected agreement calculation uses a simplified formula, making the resulting alpha an approximation.

For more examples, check out:
- 📚 [`Simple Application`](examples/SimpleApplication.js) - Basic usage examples
- 📚 [`Comparison Application`](examples/ComparisonApplication.js) - Simple comparison examples
- 📚 [`Distance Comparison Example`](examples/DistanceComparisonExample.js) - Using distance-based comparisons
- 📚 [`Krippendorff's Comparison Example`](examples/KrippendorffsComparisonExample.js) - Using Krippendorff's alpha
- 📚 [`Cohen's Comparison Example`](examples/CohensComparisonExample.js) - Using Cohen's kappa
- 📚 [`Product Review Multi-Label Example`](examples/ProductReviewMultiLabelExample.js) - More complex multi-label comparison using Krippendorff's alpha with Jaccard index.
- 📚 [`Store Review Comparison Example`](examples/StoreReviewComparisonExample.js) - Example comparing multiple reviewers (with a single label) using Krippendorff's alpha.

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

The config file (`config.yml`) should follow this structure:
```yaml
model: llama-3.2-3b-instruct  # The model name to use
path: https://127.0.0.1       # The base URL for the LLM API
port: 1234                    # The port number
endpoint: v1/chat/completions # The API endpoint
settings:
  temperature: 0.7            # Controls randomness (0.0 to 1.0)
  max_tokens: -1              # Maximum tokens to generate (-1 for unlimited)
  stream: false               # Whether to stream the response
```

### 4. 📊 Visualization
The library provides a visualization tool that generates (Mermaid) flow diagrams to help you understand and document your transformation pipelines. The visualization shows:

- The flow of data through different callers, with example data, if needed.

Here's an example of a generated diagram from the `ProductReviewMultiLabel` example:

![Flow Diagram Example](examples/flow-diagram.svg){width=50%}

For a complete example of how to generate such visualizations, check out:
- 📚 [`Visualization Example`](examples/VisualizationExample.js) - Shows how to generate and save flow diagrams

The visualization supports several configuration options:
- `labels`: Array of labels for each flow path in the same order as the input responses array
- `showExampleData`: Toggle to show/hide example data on arrows (default: false)
- `initialInputIndex`: Specify which response to use for example data (default: 0)

Using the visualization function requires a variable list of `Response` (lists) as input which is used to trace the transformation. Output is both the markdown and generated svg
