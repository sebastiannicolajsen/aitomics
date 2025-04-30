/**
 * This example demonstrates the serialization and deserialization of Response objects,
 * including proper handling of nested responses and caller registration.
 * 
 * It shows:
 * 1. Creating a composed caller that chains multiple transformations
 * 2. Serializing responses to a file
 * 3. Deserializing responses and verifying caller links
 * 4. Demonstrating that callers are properly loaded if they exist
 * 
 * Expected behavior:
 * 1. The composed caller will:
 *    - First convert the input to lowercase
 *    - Then convert it to uppercase
 *    - Finally parse it as JSON
 * 
 * 2. The response chain will show:
 *    - Each transformation in sequence
 *    - The caller ID for each step
 *    - The level of nesting for each response
 * 
 * 3. After loading from file:
 *    - The response chain structure should be identical
 *    - The callers should be properly linked (same object reference)
 *    - The output should be functionally equivalent
 * 
 * Example output structure:
 * [composed-caller-id]: '{"message": "HELLO WORLD"}' (3)
 * [aitomic.stringToJSON]: '{"message": "HELLO WORLD"}' (2)
 * [aitomic.upperCase]: '{"message": "hello world"}' (1)
 */

import { _ } from "../src/util/index.js";
import { writeResponses, readResponses } from "../src/util/index.js";

// Create a composed caller that chains multiple transformations
// The transformations will be applied in order from right to left:
// 1. stringToJSON will parse the final string into a JSON object
// 2. upperCase will convert the string to uppercase
// 3. lowerCase will convert the string to lowercase
const textProcessor = _.compose(
  _.lowerCase,    // First convert to lowercase
  _.upperCase,    // Then convert to uppercase
  _.stringToJSON  // Finally parse as JSON
);

// Process some text through our composed caller
// The input is a JSON string that will be transformed through our chain
const response = await textProcessor.run('{"message": "Hello World"}');

// Display the original response chain
// This will show each transformation in sequence, from the final output
// back to the original input, including caller IDs and nesting levels
console.log("Original response chain:");
console.log(response.toStringExpanded());

// Save the response to a file
// This will serialize the entire response chain, including all nested responses
// and their relationships to callers
const filepath = "responses.json";
writeResponses(filepath, response);
console.log("\nSaved response to", filepath);

// Read the response back from file
// This will reconstruct the response chain and link it to existing callers
// if they are available in the current session
const loadedResponse = readResponses(filepath)[0];
console.log("\nLoaded response chain:");
console.log(loadedResponse.toStringExpanded());

// Verify that the callers are properly loaded
// This checks that the loaded response is linked to the same caller objects
// as the original response, ensuring proper functionality
console.log("\nVerifying caller links:");
console.log("Original caller ID:", response.caller.id);
console.log("Loaded caller ID:", loadedResponse.caller.id);
console.log("Callers match:", response.caller === loadedResponse.caller);

// Demonstrate that the loaded response works the same as the original
// This verifies that the loaded response produces the same output
// as the original, ensuring functional equivalence
console.log("\nVerifying response functionality:");
console.log("Original output:", response.output);
console.log("Loaded output:", loadedResponse.output);
console.log("Outputs match:", JSON.stringify(response.output) === JSON.stringify(loadedResponse.output)); 