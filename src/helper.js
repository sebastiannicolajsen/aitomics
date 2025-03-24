import fs from "fs";
import YAML from "yaml";
import validateSchema from "yaml-schema-validator";

export function loadFromFile(file, schema) {
  if (typeof file !== "string") throw new Error("Not a file name");
  const data = fs.readFileSync(file, "utf8");
  const input = YAML.parse(data);
  validateObject(input, schema);
  return input;
}

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
  descriptions.reduce((e, a) => e + a, ""),
  `Categorize the input given the following labels: ${values
    .map((e) => `- '${e.label}': ${e.description}`)
    .reduce((a, e) => `${a} \n ${e}`, "")}`,
   `You can only utilise the categories above (${values.map(e => `'${e.label}'`)}), but are allowed to use multiple of them. If in doubt use '${default_value}'.`,
   `The output should be a JSON list, and only a JSON list, do not provide any formatting for the json-object`
];

// descriptions (strings), values (label, description), default_value
export function setPromptTemplate (fun){
    promptTemplate = fun
}

// parses of format:
// prompt:
//  description:
//  - Some desc
//  values:
//  - label: test
//    description: Description of that label
//  default_value: unknown
export function parseCategorizationPromptFromYML(file) {
  if (typeof file !== "string") throw new Error("Not a file name");
  const data = fs.readFileSync(file, "utf8");
  let input = YAML.parse(data);
  validateObject(input, requiredSchema);
  input = input.prompt
  return promptTemplate(input.description, input.values, input.default_value );
}
