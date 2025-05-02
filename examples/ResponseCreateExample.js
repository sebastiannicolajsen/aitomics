import { $, _ } from "../src/index.js"
import { Response } from "../src/index.js"
import { generateFlowDiagram } from "../src/visualizations/generate_flow_diagram.js"
import path from 'path'

// First create a programmatic caller with a specific name
const programmaticCaller = $((input) => input.toUpperCase(), "my-custom-caller")

// Create a response using the programmatic caller
const programmaticResponse = await programmaticCaller.run("some input")
console.log("Programmatic response:", programmaticResponse.output) // SOME INPUT

// Now create a response with the same caller name
// This will trigger a warning in the console
const customResponse = Response.create(
  "Custom data",
  "some input",
  "my-custom-caller"  // Same name as the programmatic caller
)

// Create an LLM caller for additional transformation
const addPrefix = $("Add 'Transformed: ' prefix to the input")

// Apply transformations to both responses
const result1 = await addPrefix.run(programmaticResponse)
const result2 = await addPrefix.run(customResponse)

// Generate a flow diagram showing the transformations, to illustrate issues with duplicate caller names (even though one is used as a dummy caller)
const { markdown, diagram } = await generateFlowDiagram(
  [[result1], [result2]],  // Each response array needs to be wrapped in its own array
  {
    labels: ["Programmatic Path", "Custom Path"]
  }
)

// Save the visualization
import fs from 'fs'
console.log(markdown)
// Save the diagram to a file
const diagramPath = path.join(process.cwd(), 'examples', 'flow-diagram.svg');
fs.writeFileSync(diagramPath, diagram); // note how the diagram only has a single path, as the custom caller name overlaps with the programmatic caller name (and since we provide two labels, one appears in the corner)

console.log("Note: You should see a warning in the console about the duplicate caller name 'my-custom-caller'") 