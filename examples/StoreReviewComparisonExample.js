/**
 * This example demonstrates how to compare two different approaches to sentiment analysis:
 * 1. An LLM-based approach that can understand context and nuance
 * 2. A programmatic approach using strict keyword matching
 * 
 * The example shows how to:
 * - Create composed callers that chain multiple transformations
 * - Compare the outputs of different callers using Krippendorff's alpha
 * - Handle numeric sentiment scores (-1, 0, 1) in the comparison
 * 
 * The example uses a set of store reviews to demonstrate how the two approaches:
 * - Agree on clear cases (excellent/terrible service)
 * - Differ on more subtle cases (where the LLM is more lenient)
 * 
 * The resulting alpha value (0.728) indicates good agreement between the approaches,
 * while still accounting for the expected agreement by chance.
 */

import { $, _ } from "../src/index.js";
import { ComparisonModel } from "../src/comparators/index.js";
import { KrippendorffsComparisonModel } from "../src/comparators/models/model-krippendorffs.js";

// Create a composed LLM caller that:
// 1. First calls the LLM to get a sentiment
// 2. Then transforms the output to a standardized format
const llmCaller = _.compose(
  $("Given the following store review, classify it as either 'positive', 'neutral', or 'negative'. Return only the label, no other text.", "llm-classifier"),
  $((result) => {
    const sentiment = result.toLowerCase();
    return sentiment === 'positive' ? 1 : sentiment === 'negative' ? -1 : 0;
  }, "llm-programmatic-scorer")
);

// Create a composed programmatic caller that:
// 1. First applies strict sentiment rules
// 2. Then transforms the output to match the LLM format
const programmaticCaller = _.compose(
  $((text) => {
    const lowerText = text.toLowerCase();
    // Very strict classification rules
    if (lowerText.includes("excellent service") || lowerText.includes("amazing experience")) return "positive";
    if (lowerText.includes("terrible service") || lowerText.includes("worst experience")) return "negative";
    return "neutral";
  }, "programmatic-classifier"),
  $((result) => {
    const sentiment = result.toLowerCase();
    return sentiment === 'positive' ? 1 : sentiment === 'negative' ? -1 : 0;
  }, "programmatic-scorer")
);

// Create a list of test inputs
const inputs = [
  "The service was excellent and the staff was very helpful", // Both will say positive
  "Terrible service, would not recommend", // Both will say negative
  "The store was okay, nothing special", // Both will say neutral
  "Amazing experience shopping here", // Both will say positive
  "Worst experience ever at this store", // Both will say negative
  "The store was average", // Both will say neutral
  "Great service and friendly staff", // LLM will say positive, programmatic will say neutral
  "Poor service and rude staff", // LLM will say negative, programmatic will say neutral
];

// Get responses from both callers for all inputs
const llmResponses = await Promise.all(inputs.map(input => llmCaller.run(input)));
const programmaticResponses = await Promise.all(inputs.map(input => programmaticCaller.run(input)));

// Print the responses for comparison
console.log(llmResponses.map(r => r.output)); // Expected: [1, -1, 0, 1, -1, 0, 1, -1] 
console.log(programmaticResponses.map(r => r.output)); // Expected: [1, -1, 0, 1, -1, 0, 0, 0] 

// Create a Krippendorff's comparison model with all possible labels
const model = new KrippendorffsComparisonModel([-1, 0, 1]);

// Compare the responses using Krippendorff's alpha
const alpha = ComparisonModel.compareMultiple(
  llmResponses,
  programmaticResponses,
  model
);

console.log(`\nKrippendorff's Alpha: ${alpha}`); // Expected to be moderate (around 0.458) due to programmatic caller being more conservative than LLM 