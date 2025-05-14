/**
 * This is the first part of a two-part example demonstrating response serialization
 * and deserialization across separate files.
 * 
 * This file:
 * 1. Creates a composed caller that chains multiple transformations
 * 2. Includes a custom caller that adds a timestamp
 * 3. Processes some text through the caller
 * 4. Saves the response chain to a file
 * 
 * The second part (ResponseSerializationPart2.js) will demonstrate loading
 * these responses in a context where the original callers don't exist.
 */

import { _ } from "../src/util/index.js";
import { $ } from "../src/callers/index.js";
// import writeResponses from util
import { writeResponses} from "../src/util/index.js";

// Create a custom caller that adds a timestamp to the message
const addTimestampCaller = $((content) => {
  const obj = typeof content === 'string' ? JSON.parse(content) : content;
  return {
    ...obj,
    timestamp: new Date().toISOString()
  };
}, "custom.addTimestamp");

// Create a composed caller that chains multiple transformations
const textProcessor = _.compose(
  _.upperCase,         // Convert to uppercase
  _.stringToJSON,       // Parse as JSON
  addTimestampCaller  // Add timestamp to the message
);

// Process some text through our composed caller
const response = await textProcessor.run('{"message": "Hello World"}');

// Display the original response chain
console.log("Original response chain:");
console.log(response.toStringExpanded());

// Save the response to a file
const filepath = "responses.json";
writeResponses(filepath, response);
console.log("\nSaved response to", filepath);

// Display the structure of the saved response
console.log("\nSaved response structure:");
console.log(JSON.stringify(response.toJSON(), null, 2)); 