import { $, _ } from "../src/index.js"
import { Response } from "../src/index.js"
import { KrippendorffsComparisonModel } from "../src/index.js"
import fs from 'fs'
import path from 'path'
import { ComparisonModel } from "../src/index.js"

// Load the customer reviews
const reviewsPath = path.join(process.cwd(), 'examples', 'data', 'customer_reviews.json')
const { reviews } = JSON.parse(fs.readFileSync(reviewsPath, 'utf8'))

// Create an LLM caller for sentiment analysis
const llmAnalyzer = $(
  "Analyze the sentiment of this customer review. Return exactly one of these codes: POSITIVE, NEGATIVE, or NEUTRAL. " +
  "POSITIVE for very satisfied customers, NEGATIVE for very dissatisfied customers, and NEUTRAL for mixed or moderate reviews.",
  "llm_analysis"
)

// Process each review
const processReview = async (review) => {
  // Create a response for the human coding
  const humanResponse = Response.create(
    review.codes[0],  // output (the human's code)
    review.text,      // input (the review text)
    "human_coding"    // caller name
  )

  // Get LLM analysis
  const llmResponse = await llmAnalyzer.run(review.text)

  return { humanResponse, llmResponse }
}

// Process all reviews
console.log("Processing reviews...")
const results = await Promise.all(reviews.map(processReview))

// Extract responses for comparison and ensure they match by input
const humanResponses = results.map(r => r.humanResponse)
const llmResponses = results.map(r => r.llmResponse)

// Sort both arrays by input text to ensure matching
const sortByInput = (a, b) => a.input.localeCompare(b.input)
humanResponses.sort(sortByInput)
llmResponses.sort(sortByInput)


// Compare using Krippendorff's alpha
const model = new KrippendorffsComparisonModel(["POSITIVE", "NEGATIVE", "NEUTRAL"])
const alpha = ComparisonModel.compareMultiple(humanResponses, llmResponses, model)

// Print results
console.log("\nResults:")
console.log("Krippendorff's Alpha:", alpha)

// Print individual comparisons (now sorted by input text)
console.log("\nDetailed Comparison:")
humanResponses.forEach((humanResponse, i) => {
  const llmResponse = llmResponses[i]
  console.log(`\nReview ${i + 1}:`)
  console.log("Text:", humanResponse.input)
  console.log("Human:", humanResponse.output)
  console.log("LLM:", llmResponse.output)
})

// Generate a flow diagram
import { generateFlowDiagram } from "../src/visualizations/generate_flow_diagram.js"
const { markdown, diagram } = await generateFlowDiagram(
  [humanResponses, llmResponses],
  {
    labels: ["Human Coding", "LLM Analysis"]
  }
)

// Save the diagram
const diagramPath = path.join(process.cwd(), 'examples', 'customer-review-flow.svg')
fs.writeFileSync(diagramPath, diagram)
console.log("\nFlow diagram saved to:", diagramPath) 