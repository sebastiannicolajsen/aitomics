import { ProgrammaticCaller } from "../callers/caller-programmatic.js";
import { $ } from "../callers/caller-utils.js";
import { Response } from "../response/response.js";
import { LLMCaller } from "../callers/caller-llm.js";

const PREFIX = "aitomic";

/**
 * Provides a set of standard callers including the ability to compose them.
 */
export const _ = {
  compose: (...all) => {
    const f = all.reduce(
      (s, a) => async (v) => {
        const result = await s(v);
        return await a.run(result);
      },
      async (v) => v
    );

    return { run: f };
  },
  stringToJSON: $((i) => JSON.parse(i), `${PREFIX}.stringToJSON`),
  JSONToString: $((i) => JSON.stringify(i), `${PREFIX}.JSONToString`),
  lowerCase: $((a) => a.toLowerCase(), `${PREFIX}.lowerCase`),
  upperCase: $((a) => a.toUpperCase(), `${PREFIX}.upperCase`),
  id: $((i) => i, `${PREFIX}.id`),
  extract: (f) => $((i) => i[f], `extract.${f}`), 
};

/**
 * Creates a utility analysis by allowing a prompt to be used to analyze the last response (i.e., given an input/output and prompt) and add this to an object.
 * @param {Object} config Configuration for the rating utility
 * @param {string} config.name The name of the utility (e.g., 'inference' or 'confidence')
 * @param {string} config.prompt The prompt to use for rating
 * @returns {ProgrammaticCaller} A composed caller that implements the rating utility (which always outputs the input object appended with the analysis, the output is the output value of the object returned)
 */
export const createUtilityAnalysisCaller = ({ name, variable, prompt }) => {
  let memory = {};

  return _.compose(
    $((i, response) => {
      if (typeof i === "object") {
        if (!i.output)
          throw new Error(
            `When running ${name} check, and input is an object, it should have a 'value' property.`
          );
        if (typeof i.output !== "string")
          throw new Error(
            `When running ${name} check, value of input (if object) should be either a string or a response`
          );
        memory = i;
      } else if (typeof i === "string") memory.output = i;
      else {
        throw new Error(
          `When running ${name} check, input should be either a string or an object`
        );
      }

      if (typeof i !== "object" && !(response instanceof Response)) {
        throw new Error(
          `When running ${name} check, we should have a previous response`
        );
      }

      return `Previous task: You responded with '${i}' given the input '${response.input}' by using the prompt '${response.caller.context}'`;
    }, `${name}.1.generate-input`),
    $(prompt, `${name}.2.llm-check`),
    $((i, response) => {
      if (memory.output) {
        let tmp = memory;
        memory = {};
        return {
          ...tmp,
          [variable]: i.trim(),
        };
      } else {
        return {
          [variable]: i.trim(),
          output: response.get(2).output,
        };
      }
    }, `${name}.3.structure-output`)
  );
};

/**
 * Creates a confidence analysis caller, providing a prompt which suggests the confidence of the response given the input (and prompt). Outputs an object containing the previous input, and a 'confidence' property (1 is low/bad, 10 is high/good).
 */
_.confidence = createUtilityAnalysisCaller({
  name: `${PREFIX}.confidence`,
  variable: "confidence",
  prompt:
    "Rate the confidence (i.e., how certain are you that the response follows from the input) of the response given as input, on a scale from '1-10' (1 being no necessary truth, 10 being certain objective truth) only return the number (1-10) no other signs.",
});

/**
 * Creates an inference analysis caller, providing a prompt which suggests the inference of the response given the input (and prompt). Outputs an object containing the previous input, and an 'inference' property (1 is low/good, 10 is high/bad).
 */
_.inference = createUtilityAnalysisCaller({
  name: `${PREFIX}.inference`,
  variable: "inference",
  prompt:
    "Rate the inference (i.e., how well does the response follow from the input) of the response given as input, on a scale from '1-10' (10 being multiple steps of inference others wouldnt be able to follow, 1 being no steps of inference) only return the number (1-10) no other signs.",
});
