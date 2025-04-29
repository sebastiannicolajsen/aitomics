import { $, _ } from "../src/index.js";
import { ComparisonModel } from "../src/comparators/index.js";
import { KrippendorffsComparisonModel } from "../src/comparators/models/model-krippendorffs.js";

// Create both an LLM caller and a programmatic caller for sentiment analysis
const llmCaller = $("Given the following text, classify it as either 'positive', 'neutral', or 'negative'. Return only the label, no other text.");
const programmaticCaller = $((text) => {
  const lowerText = text.toLowerCase();
  // Very strict classification rules - only exact matches
  if (lowerText === "this product is amazing" || lowerText === "i love this product") return "positive";
  if (lowerText === "this product is terrible" || lowerText === "i hate this product") return "negative";
  return "neutral";
});

// Create a list of test inputs with clear, unambiguous cases
const inputs = [
  "This product is amazing", // Both will say positive
  "This product is terrible", // Both will say negative
  "This is a neutral product", // Both will say neutral
  "I love this product", // LLM will say positive, programmatic will say positive
  "I hate this product", // Both will say negative
  "This product is okay", // LLM will say neutral, programmatic will say neutral
  "This product is great", // LLM will say positive, programmatic will say neutral (more restrictive)
  "This product is bad", // LLM will say negative, programmatic will say neutral (more restrictive)
];

// Get responses from both callers for all inputs
const llmResponses = await Promise.all(inputs.map(input => llmCaller.run(input)));
const programmaticResponses = await Promise.all(inputs.map(input => programmaticCaller.run(input)));

// Print the responses for comparison
console.log(llmResponses.map(r => r.output)); // Expected: ['positive', 'negative', 'neutral', 'positive', 'negative', 'neutral', 'positive', 'negative']
console.log(programmaticResponses.map(r => r.output)); // Expected: ['positive', 'negative', 'neutral', 'positive', 'negative', 'neutral', 'neutral', 'neutral']

// Create a Krippendorff's comparison model with all possible labels
const model = new KrippendorffsComparisonModel(['positive', 'neutral', 'negative']);

// Compare the responses using Krippendorff's alpha
const alpha = ComparisonModel.compareMultiple(llmResponses, programmaticResponses, model);

console.log(alpha); // Expected: 0.647 (substantial agreement across all categories) 