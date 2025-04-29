import { $, _ } from "../src/index.js";
import { Comparator } from "../src/comparators/comparator.js";
import { CohensComparisonModel } from "../src/comparators/models/model-cohens.js";

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

// Create a Cohen's comparison model for each sentiment category
const positiveModel = new CohensComparisonModel("positive");
const negativeModel = new CohensComparisonModel("negative");
const neutralModel = new CohensComparisonModel("neutral");

// Compare the responses using Cohen's kappa for each category
const positiveKappa = Comparator.compareMultiple(llmResponses, programmaticResponses, positiveModel);
const negativeKappa = Comparator.compareMultiple(llmResponses, programmaticResponses, negativeModel);
const neutralKappa = Comparator.compareMultiple(llmResponses, programmaticResponses, neutralModel);

console.log(positiveKappa); // Expected: 0.71 (substantial agreement on positive sentiment)
console.log(negativeKappa); // Expected: 0.71 (substantial agreement on negative sentiment)
console.log(neutralKappa); // Expected: 0.5 (moderate agreement on neutral sentiment)