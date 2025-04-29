/**
 * This example demonstrates how to compare two different approaches to multi-label classification:
 * 1. An LLM-based approach that can identify multiple aspects of a product review
 * 2. A programmatic approach using keyword matching for different aspects
 * 
 * The example shows how to:
 * - Create composed callers that can return multiple labels
 * - Compare multi-label outputs using Krippendorff's alpha
 * - Handle arrays of labels in the comparison
 * 
 * The example uses a set of product reviews to demonstrate how the two approaches:
 * - Can identify multiple aspects of a product (quality, price, design, etc.)
 * - May differ in how many aspects they identify
 * - Can be compared even when they produce different numbers of labels
 */

import { $, _ } from "../src/index.js";
import { ComparisonModel } from "../src/comparators/index.js";
import { KrippendorffsComparisonModel } from "../src/comparators/models/model-krippendorffs.js";

// Create a composed LLM caller that:
// 1. First calls the LLM to get multiple aspects
// 2. Then transforms the output to a standardized format
const llmCaller = _.compose(
  $("Given the following product review, identify ONLY the aspects that are EXPLICITLY mentioned (quality, price, design, durability, customer service). Be strict and only include aspects that are clearly mentioned. Return only the labels, comma-separated, no other text. If no aspects are mentioned, return an empty string.", "llm-classifier"),
  $((result) => {
    const lowerResult = result ? result.toLowerCase().trim() : "";
    // Handle empty string, "none", or "empty string" cases explicitly
    if (!lowerResult || lowerResult === "none" || lowerResult === "empty string") return [];
    
    // Split the comma-separated labels, filter out empty strings, trim, normalize, and sort
    return lowerResult
      .split(",")
      .map(s => s.trim())
      .filter(s => s !== "") // Filter out empty strings resulting from split
      .map(s => s === "build quality" ? "quality" : s) // Normalize "build quality"
      .sort();
  }, "llm-programmatic-scorer")
);

// Create a composed programmatic caller that:
// 1. First applies strict keyword rules for each aspect
// 2. Then transforms the output to match the LLM format
const programmaticCaller = _.compose(
  $((text) => {
    const lowerText = text.toLowerCase();
    const aspects = [];
    
    // Quality-related keywords
    if (lowerText.includes("quality") || lowerText.includes("well made") || lowerText.includes("excellent build")) {
      aspects.push("quality");
    }
    
    // Price-related keywords
    if (lowerText.includes("price") || lowerText.includes("cost") || lowerText.includes("expensive") || lowerText.includes("cheap")) {
      aspects.push("price");
    }
    
    // Design-related keywords
    if (lowerText.includes("design") || lowerText.includes("look") || lowerText.includes("style") || lowerText.includes("beautiful")) {
      aspects.push("design");
    }
    
    // Durability-related keywords
    if (lowerText.includes("durable") || lowerText.includes("last") || lowerText.includes("sturdy") || lowerText.includes("break")) {
      aspects.push("durability");
    }
    
    // Customer service-related keywords
    if (lowerText.includes("service") || lowerText.includes("support") || lowerText.includes("helpful") || lowerText.includes("staff")) {
      aspects.push("customer service");
    }
    
    return aspects.sort();
  }, "programmatic-classifier")
);

// Create a list of test inputs
const inputs = [
  "The product is well made and beautiful, but quite expensive", // Both will say [quality, price, design]
  "Great customer service and the item is very durable", // Both will say [customer service, durability]
  "The design is nice but it broke after a week", // Both will say [design, durability]
  "Excellent build quality and helpful staff", // Both will say [quality, customer service]
  "It's cheap but looks good", // Both will say [price, design]
  "The product is okay, nothing special", // LLM might say [quality], programmatic will say []
  "Beautiful design and great value for money", // Both will say [design, price]
  "The staff was rude and the product broke immediately", // Both will say [customer service, durability]
];

// Get responses from both callers for all inputs
const llmResponses = await Promise.all(inputs.map(input => llmCaller.run(input)));
const programmaticResponses = await Promise.all(inputs.map(input => programmaticCaller.run(input)));

// Print the responses for comparison
console.log(llmResponses.map(r => r.output));
console.log(programmaticResponses.map(r => r.output));

// Create a Krippendorff's comparison model with all possible labels
const model = new KrippendorffsComparisonModel([
  "quality",
  "price",
  "design",
  "durability",
  "customer service",
  "cheap"
]);

// Compare the responses using Krippendorff's alpha
const alpha = ComparisonModel.compareMultiple(
  llmResponses,
  programmaticResponses,
  model
);

console.log(`\nKrippendorff's Alpha: ${alpha}`); // Expected to be high due to clear, unambiguous cases 