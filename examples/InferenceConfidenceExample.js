/**
 * This example demonstrates how to use the inference and confidence utilities:
 * 1. Using _.inference to rate how well an LLM's response follows from its input
 * 2. Using _.confidence to rate how confident the LLM is in its response
 * 3. Combining both utilities to get a comprehensive assessment
 */

import { $, _, createUtilityAnalysisCaller } from "../src/index.js"

// Create an LLM caller for sentiment analysis
const sentimentAnalyzer = $(
  "Analyze the sentiment of this text. Return exactly one of: POSITIVE, NEGATIVE, or NEUTRAL.",
  "sentiment-analyzer"
)

// Example 1: Using inference to rate how well the response follows from the input
const text1 = "I absolutely love this product! It's amazing and works perfectly."
const response1 = await sentimentAnalyzer.run(text1)

const inferenceResult = await _.inference.run(response1)


console.log("\nExample 1 - Inference Rating:")
console.log("Input:", text1)
console.log("Response:", inferenceResult.output.output)
console.log("Inference Rating:", inferenceResult.output.inference) // Should be high (8-10) as the response clearly follows from the input

// Example 2: Using confidence to rate how confident the LLM is in its response
const text2 = "The product is okay, I guess. It works sometimes."
const response2 = await sentimentAnalyzer.run(text2)
const confidenceResult = await _.confidence.run(response2)

console.log("\nExample 2 - Confidence Rating:")
console.log("Input:", text2)
console.log("Response:", confidenceResult.output.output)
console.log("Confidence Rating:", confidenceResult.output.confidence) // Might be lower (6-9) as the input is ambiguous

// Example 3: Combining both utilities
const text3 = "This is the worst product ever! Complete waste of money."
const response3 = await sentimentAnalyzer.run(text3)
const combinedResult = await _.compose(_.inference, _.confidence).run(response3)
console.log("\nExample 3 - Combined Ratings:")
console.log("Input:", text3)
console.log("Response:", combinedResult.output.output)
console.log("Inference Rating:", combinedResult.output.inference) // Should be high as the response clearly follows
console.log("Confidence Rating:", combinedResult.output.confidence) // Should be high as the input is very clear


// Example 4: Creating a custom utility caller:
const customUtility = createUtilityAnalysisCaller({
  name: "custom-utility",
  variable: "custom",
  // some prompt which suggests the quality of the response, using fixed labels not a scale
  prompt: "Rate the quality of the response given as input, which can be labelled as either 'good', 'bad', or 'neutral'. Only return the quality label, no other signs."
})



const response4 = await customUtility.run(response3)
console.log("\nExample 4 - Custom Utility Rating:")
console.log("Input:", response4.input.output)
console.log("Response:", response4.output.output)
console.log("Custom Utility Rating:", response4.output.custom) // Should be 'good' as the response is positive

