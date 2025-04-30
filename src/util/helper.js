import fs from "fs";
import YAML from "yaml";
import validateSchema from "yaml-schema-validator";
import { Response } from "../response/index.js";

const AITOMICS_FILE_HEADER = "AITOMICS_RESPONSE_FILE_v1";

/**
 * Load YML from file, and validate according to the schema
 * @param {string} file
 * @param {Object} schema
 * @returns object resulted from parsing
 */
export function loadFromFile(file, schema) {
  if (typeof file !== "string") throw new Error("Not a file name");
  const data = fs.readFileSync(file, "utf8");
  const input = YAML.parse(data);
  validateObject(input, schema);
  return input;
}

/**
 * Validate an object against a schema
 * @param {Object} obj
 * @param {Object} schema
 */
export function validateObject(obj, schema) {
  validateSchema(obj, { schema, logLevel: "error" });
}

const requiredSchema = {
  prompt: {
    description: [{ type: String, required: false }],
    values: [
      {
        label: { type: String, required: true },
        description: { type: String, required: true },
      },
    ],
    default_value: { type: String, required: true },
    required: true,
  },
  required: true,
};

let promptTemplate = (descriptions, values, default_value) => [
  ...descriptions,
  ...values.map((v) => `'${v.label}': ${v.descriptions}`),
  `If nothing is applicable only return the value '${default_value}'`,
];

/**
 * Update the default prompt template used.
 * @param {Function} fun - must take descriptions(strings), values (label, description), default_value
 */
export function setPromptTemplate(fun) {
  promptTemplate = fun;
}

/**
 * parses a given prompt from a YML file, must adhere to following format:
 * prompt:
 *  description:
 *  - Some description
 *  values:
 *  - label: some label
 *    description: Description of that label
 *  default_value: unknown
 * @param {string} file
 * @returns
 */
export function parseCategorizationPromptFromYML(file) {
  if (typeof file !== "string") throw new Error("Not a file name");
  const data = fs.readFileSync(file, "utf8");
  let input = YAML.parse(data);
  validateObject(input, requiredSchema);
  input = input.prompt;
  return promptTemplate(input.description, input.values, input.default_value);
}

/**
 * Writes one or more Response objects to a file
 * @param {string} filepath - Path to write the file to
 * @param {Response | Response[]} responses - Single Response or array of Responses to write
 */
export function writeResponses(filepath, responses) {
  const data = {
    _header: AITOMICS_FILE_HEADER,
    timestamp: new Date().toISOString(),
    responses: Array.isArray(responses) ? responses : [responses]
  };
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

/**
 * Reads Response objects from a file
 * @param {string} filepath - Path to read the file from
 * @returns {Response[]} Array of Response objects
 */
export function readResponses(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  const data = JSON.parse(content);
  
  if (data._header !== AITOMICS_FILE_HEADER) {
    throw new Error("Invalid file format: Not an Aitomics response file");
  }

  // Helper function to recursively parse nested responses
  function parseNestedResponse(obj) {
    if (typeof obj === 'string') return obj;
    
    // Validate Response structure
    if (!('caller' in obj) || !('input' in obj) || !('output' in obj)) {
      throw new Error("Invalid file format: Response structure has been tampered with");
    }
    
    const response = Response.parse(obj);
    response.input = parseNestedResponse(response.input);
    return response;
  }

  return data.responses.map(obj => parseNestedResponse(obj));
}
