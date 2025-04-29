import { $, _ } from "../src/index.js";
import { Comparator } from "../src/comparators/comparator.js";
import { DistanceComparisonModel } from "../src/comparators/models/model-distance.js";

// Create both an LLM caller and a programmatic caller
const llmCaller = $("Given the following text, classify it as either 'positive', 'neutral', or 'negative'. Return only the label, no other text.");
const programmaticCaller = $((text) => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes("amazing") || lowerText.includes("enjoyed")) return "positive";
  if (lowerText.includes("terrible") || lowerText.includes("hate")) return "negative";
  return "neutral";
});

// Use the same input for both callers
const input = "I really enjoyed this product, it's amazing!";

// Get responses from both callers
const llmResponse = await llmCaller.run(input);
const programmaticResponse = await programmaticCaller.run(input);

console.log(llmResponse.output); // Expected: "positive" - LLM should recognize the positive sentiment
console.log(programmaticResponse.output); // Expected: "positive" - matches "enjoyed" and "amazing" keywords

// Create a distance comparison model
// The ordered list represents the possible labels in order of sentiment
const orderedList = ["negative", "neutral", "positive"];
const distanceModel = new DistanceComparisonModel(1, orderedList);

// Create a comparator for the two responses
const comparator = new Comparator(llmResponse, programmaticResponse);

// Run the comparison
const similarity = comparator.run(distanceModel);
console.log(similarity); // Expected: 1.0 - both callers return "positive"

// Example with a different input
const input2 = "The product is disappointing, but not terrible."; // LLM might see this as negative, while programmatic will see it as neutral
const llmResponse2 = await llmCaller.run(input2);
const programmaticResponse2 = await programmaticCaller.run(input2);

console.log(llmResponse2.output); // Expected: "negative" - LLM should recognize the negative sentiment in "disappointing"
console.log(programmaticResponse2.output); // Expected: "neutral" - no explicit positive/negative keywords matched

// Compare the second set of responses
const comparator2 = new Comparator(llmResponse2, programmaticResponse2);
const similarity2 = comparator2.run(distanceModel);
console.log(similarity2); // Expected: 0.5 - one step difference between "negative" and "neutral" 