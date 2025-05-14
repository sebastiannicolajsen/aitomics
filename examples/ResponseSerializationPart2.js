/**
 * This is the second part of a two-part example demonstrating response serialization
 * and deserialization across separate files.
 * 
 * This file:
 * 1. Loads responses from a file created by ResponseSerializationPart1.js
 * 2. Demonstrates that the responses are loaded with temporary callers
 * 3. Shows how to register new callers to replace the temporary ones
 * 
 * Note: This file doesn't have access to the original callers used in Part 1,
 * so it will demonstrate how the pending caller lookup system works.
 */
import { readResponses } from "../src/util/index.js";
import { _ } from "../src/util/index.js";
import { $ } from "../src/callers/index.js";

// Read the response from file
const filepath = "responses.json";
const loadedResponse = readResponses(filepath)[0];

// Display the loaded response chain
console.log("Loaded response chain (with temporary callers):");
console.log(loadedResponse.toStringExpanded());

// Create a new custom caller that adds a timestamp
// This will automatically link to any pending responses with matching IDs
const addTimestampCaller = $((content) => {
  const obj = typeof content === 'string' ? JSON.parse(content) : content;
  return {
    ...obj,
    timestamp: new Date().toISOString()
  };
}, "custom.addTimestamp");

// Display the response chain after linking new callers
console.log("\nResponse chain after linking new callers:");
console.log(loadedResponse.toStringExpanded());

// Verify that the response works with the new callers
console.log("\nVerifying response functionality with new callers:");
console.log("Output:", loadedResponse.output);
console.log("Output type:", typeof loadedResponse.output);
console.log("Is valid JSON:", loadedResponse.output instanceof Object);
console.log("Has timestamp:", 'timestamp' in loadedResponse.output);
console.log("Timestamp:", loadedResponse.output.timestamp);

// Verify that the caller function is properly linked
console.log("\nVerifying caller function linking:");
console.log("Custom caller ID:", addTimestampCaller.id);
console.log("Response caller ID:", loadedResponse.caller.id);
console.log("Caller IDs match:", addTimestampCaller.id === loadedResponse.caller.id);
console.log("Caller functions are the same:", addTimestampCaller.run === loadedResponse.caller.run);