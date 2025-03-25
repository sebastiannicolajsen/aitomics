import fs from "fs";
import YAML from "yaml";
import validateSchema from "yaml-schema-validator";

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
