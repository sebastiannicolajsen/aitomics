/**
 * This example demonstrates how to use the visualization functionality to generate flow diagrams
 * and explanations for response comparisons. It uses the ProductReviewMultiLabel example as a base
 * but focuses on showing how to visualize the flow of data through different callers and their comparison.
 */

import { $, _ } from "../src/index.js";
import { Comparator } from "../src/comparators/comparator.js";
import { KrippendorffsComparisonModel } from "../src/comparators/models/model-krippendorffs.js";
import { generateFlowDiagram } from "../src/visualizations/generate_flow_diagram.js";
import fs from 'fs';
import path from 'path';

const llmCaller = _.compose(
  $("Given the following product review, identify ONLY the aspects that are EXPLICITLY mentioned (quality, price, design, durability, customer service). Be strict and only include aspects that are clearly mentioned. Return only the labels, comma-separated, no other text. If no aspects are mentioned, return an empty string.", "LLM-analysis"),
  $((result) => {
    const lowerResult = result ? result.toLowerCase().trim() : "";
    if (!lowerResult || lowerResult === "none" || lowerResult === "empty string") return [];
    return lowerResult
      .split(",")
      .map(s => s.trim())
      .filter(s => s !== "")
      .map(s => s === "build quality" ? "quality" : s)
      .sort();
  }, "Clean llm output")
);

const programmaticCaller = _.compose(
  $((text) => {
    const lowerText = text.toLowerCase();
    const aspects = [];
    if (lowerText.includes("quality") || lowerText.includes("well made") || lowerText.includes("excellent build")) {
      aspects.push("quality");
    }
    if (lowerText.includes("price") || lowerText.includes("cost") || lowerText.includes("expensive") || lowerText.includes("cheap")) {
      aspects.push("price");
    }
    if (lowerText.includes("design") || lowerText.includes("look") || lowerText.includes("style") || lowerText.includes("beautiful")) {
      aspects.push("design");
    }
    if (lowerText.includes("durable") || lowerText.includes("last") || lowerText.includes("sturdy") || lowerText.includes("break")) {
      aspects.push("durability");
    }
    if (lowerText.includes("service") || lowerText.includes("support") || lowerText.includes("helpful") || lowerText.includes("staff")) {
      aspects.push("customer service");
    }
    return aspects.sort();
  }, "programmatic classification")
);

const inputs = [
  "The product is well made and beautiful, but quite expensive",
  "Great customer service and the item is very durable",
  "The design is nice but it broke after a week",
  "Excellent build quality and helpful staff",
  "It's cheap but looks good",
  "The product is okay, nothing special",
  "Beautiful design and great value for money",
  "The staff was rude and the product broke immediately",
];

const llmResponses = await Promise.all(inputs.map(input => llmCaller.run(input)));
const programmaticResponses = await Promise.all(inputs.map(input => programmaticCaller.run(input)));

const model = new KrippendorffsComparisonModel([
  "quality",
  "price",
  "design",
  "durability",
  "customer service",
  "cheap"
]);

const alpha = Comparator.compareMultiple(
  llmResponses,
  programmaticResponses,
  model
);

console.log(`\nKrippendorff's Alpha: ${alpha}`);

// Generate and display the visualization with custom labels and example data on arrows
// Set showExampleData to false or omit it to hide data on arrows.
const { markdown, diagram } = await generateFlowDiagram(
  [llmResponses, programmaticResponses,programmaticResponses], 
  {
    labels: ["LLM Processing", "Programmatic Processing"],
    showExampleData: true,
    initialInputIndex: 0
  }
);

// Print the markdown
console.log(markdown);

// Save the diagram to a file
const diagramPath = path.join(process.cwd(), 'examples', 'flow-diagram.svg');
fs.writeFileSync(diagramPath, diagram);



