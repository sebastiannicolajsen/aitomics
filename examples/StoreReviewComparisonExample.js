import { $, _ } from "../src/index.js";
import { Comparator } from "../src/comparators/comparator.js";
import { KrippendorffsComparisonModel } from "../src/comparators/models/model-krippendorffs.js";

// Create a composed LLM caller that:
// 1. First calls the LLM to get a sentiment
// 2. Then transforms the output to a standardized format
const llmCaller = $("Given the following store review, classify it as either 'positive', 'neutral', or 'negative'. Return only the label, no other text.")
  .then((result) => {
    // Transform the output to a standardized format
    const sentiment = result.output.toLowerCase();
    return {
      sentiment,
      formatted: `Sentiment: ${sentiment.toUpperCase()}`,
      score: sentiment === 'positive' ? 1 : sentiment === 'negative' ? -1 : 0
    };
  });

// Create a composed programmatic caller that:
// 1. First applies strict sentiment rules
// 2. Then transforms the output to match the LLM format
const programmaticCaller = $((text) => {
  const lowerText = text.toLowerCase();
  // Very strict classification rules
  if (lowerText.includes("excellent service") || lowerText.includes("amazing experience")) return "positive";
  if (lowerText.includes("terrible service") || lowerText.includes("worst experience")) return "negative";
  return "neutral";
}).then((result) => {
  // Transform to match LLM output format
  const sentiment = result.output.toLowerCase();
  return {
    sentiment,
    formatted: `Sentiment: ${sentiment.toUpperCase()}`,
    score: sentiment === 'positive' ? 1 : sentiment === 'negative' ? -1 : 0
  };
});

// Create a list of test inputs with clear, unambiguous cases
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
console.log("LLM Responses:");
llmResponses.forEach((r, i) => {
  console.log(`Input: ${inputs[i]}`);
  console.log(`Output: ${JSON.stringify(r.output, null, 2)}`);
  console.log("---");
});

console.log("\nProgrammatic Responses:");
programmaticResponses.forEach((r, i) => {
  console.log(`Input: ${inputs[i]}`);
  console.log(`Output: ${JSON.stringify(r.output, null, 2)}`);
  console.log("---");
});

// Create a Krippendorff's comparison model with all possible labels
const model = new KrippendorffsComparisonModel(['positive', 'neutral', 'negative']);

// Compare the responses using Krippendorff's alpha
const alpha = Comparator.compareMultiple(
  llmResponses.map(r => ({ output: r.output.sentiment })),
  programmaticResponses.map(r => ({ output: r.output.sentiment })),
  model
);

console.log(`\nKrippendorff's Alpha: ${alpha}`); // Expected to be high due to clear, unambiguous cases 