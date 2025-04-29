import { Caller } from "../callers/base.js";
import { Comparator } from "../comparators/comparator.js";

/**
 * Generating type, i.e., programmatically generated (either using llm or function) as alternative some input
 */
export const generatingType = Object.freeze({
  PROGRAMMATIC: Symbol("generatingType.programmatic"),
  INPUT: Symbol("generatingType.input"),
  CUSTOM: Symbol("generatingType.custom"),
});

/**
 * A response to track previous transformations applied through Callers
 */
export class Response {
  /**
   * Create a response
   * @param {Object | string} output - the generated output
   * @param {Caller} caller - the caller used to generate the output
   * @param {Response | string} input - the input used for the Caller
   * @param {undefined | string} generator - default to GeneratingType.PROGRAMMATIC but alternatives can be specified
   */
  constructor(output, caller, input, generator = generatingType.PROGRAMMATIC) {
    this.output = output;
    if (!(caller instanceof Caller))
      throw new Error("Not a proper caller type");
    this.caller = caller;
    this.input = input;
    this.generator = generator;
    this.root = !(input instanceof Response);
    this.level = this.root ? 1 : this.input.level + 1;
  }

  /**
   * Get the caller used to create the transformation
   * @returns Caller
   */
  getCaller() {
    return this.caller;
  }

  /**
   * Get the generator (i.e., the type of generator)
   * @returns generatingType
   */
  getGeneratorType() {
    return this.generator;
  }

  /**
   * Get the level of the response (i.e., the number of transformation in a potential series of these)
   * @returns number
   */
  getLevel() {
    return this.level;
  }

  /**
   * Get the input used to produce this response
   * @returns Caller | string
   */
  getInput() {
    return this.input;
  }

  /**
   * Determine whether or not this is the first transformation applied to the input
   * @returns boolean
   */
  isRoot() {
    return this.isRoot;
  }

  /**
   * Compare two responses
   * @param {Response} response
   * @returns boolean
   */
  equals(response) {
    return (
      response instanceof Response &&
      this.input === response.input &&
      this.caller === response.caller
    );
  }

  /**
   * retrieves the root input (nested in multiple transformations)
   * @returns Object | string
   */
  rootInput() {
    let curr = this;
    while (typeof curr !== "string") {
      curr = curr.input;
    }
    return curr;
  }

  /**
   * Transforms the response to a string of [caller id]: output (# which the response is in chain)
   * @returns string
   */
  toString() {
    return `[${this.caller.id}]: '${this.output}' (${this.level})`;
  }

  /**
   * Provides a string version of all nested responses.
   * @param {undefined | boolean} newline - whether or not to provide newline inbetween
   * @returns string
   */
  toStringExpanded(newline = true) {
    let str = "";
    let curr = this;
    while (typeof curr !== "string") {
      str += curr + (newline ? "\n" : "");
      curr = curr.input;
    }
    return str;
  }
  /**
   * to provide a shallow copy for json (includes caller simply as id)
   */
  toJSON() {
    return {
      output: this.output,
      caller: this.caller.id,
      input: this.input,
      root: this.root,
      level: this.level
    }
  }

  /**
   * Create a comparator between this and and another response
   * @param {Response} b
   * @returns Comparator
   */
  compare(b) {
    return new Comparator(this, b);
  }

  

  /**
   * Parses an Object into a Response
   * @param {Object} obj
   * @returns Response
   */
  static parse(obj) {
    return Object.assign(new Response(), obj);
  }
}
