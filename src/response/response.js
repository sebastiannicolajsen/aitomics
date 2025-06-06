import { Caller, existingCallers } from "../callers/base.js";
import { ComparisonModel } from "../comparators/comparator.js";

/**
 * Generating type, i.e., programmatically generated (either using llm or function) as alternative some input
 */
export const generatingType = Object.freeze({
  PROGRAMMATIC: Symbol("generatingType.programmatic"),
  INPUT: Symbol("generatingType.input"),
  CUSTOM: Symbol("generatingType.custom"),
});

// Store for pending caller lookups
const pendingCallerLookups = new Map();

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

  /** for creating a response without a caller, if no callerName is provided, a dummy caller is created (using the name "identity"). Uses the generatingType.CUSTOM */
  static create(output, input, callerName = null) {
    // Create a simple identity caller object
    const identityCaller = {
      id: callerName === null ? "identity" : callerName,
      run: async (content) => content
    };

    // Cast to Caller
    Object.setPrototypeOf(identityCaller, Caller.prototype);
    
    // Only warn if this is a registered caller
    if (callerName !== null && existingCallers[identityCaller.id]) {
      console.warn(`Warning: Duplicate caller ID '${identityCaller.id}' used when creating a response with Response.create().`);
    }

    return new Response(output, identityCaller, input, generatingType.CUSTOM);
  }

  /**
   * Get the caller used to create the transformation
   * @returns Caller
   */
  getCaller() {
    return this.caller;
  }

  /**
   * Get the response at a given level (backtracking from current response), 0 being the previous response.
   * @param {number} level
   * @returns Response
   */
  get(level = 0){
    let curr = this;
    for(let i = 0; i < level; i++){
      if(!(curr instanceof Response)) throw new Error("Cannot get a response at level " + level + " because the response at level " + (level - 1) + " was not a response.");
      curr = curr.input;
    }
    return curr;
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
    while (curr instanceof Response) {
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
    while (curr instanceof Response) {
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
      input: this.input instanceof Response ? this.input.toJSON() : this.input,
      root: this.root,
      level: this.level,
      generator: this.generator
    }
  }

  /**
   * Create a comparison model between this and another response
   * @param {Response} b
   * @returns ComparisonModel
   */
  compare(b) {
    return new ComparisonModel(this, b);
  }

  /**
   * Parses an Object into a Response
   * @param {Object} obj
   * @returns Response
   */
  static parse(obj) {
    // Create a temporary caller object if needed
    let caller = obj.caller;
    if (typeof caller === 'string') {
      const existingCaller = existingCallers[caller];
      if (existingCaller) {
        caller = existingCaller;
      } else {
        // Create a temporary caller object with just the ID
        caller = { id: caller };
      }
    }

    // Create the response with the caller
    const response = !(caller instanceof Caller)
      ? Response.create(obj.output, obj.input, obj.caller)
      : new Response(obj.output, caller, obj.input, obj.generator);
    
    // Set additional properties
    response.root = obj.root;
    response.level = obj.level;

    // Recursively parse input if it's a Response object
    if (obj.input && typeof obj.input === 'object' && 'caller' in obj.input) {
      response.input = Response.parse(obj.input);
    }

    // If we're using a temporary caller, add this response to pending lookups
    if (!(caller instanceof Caller)) {
      if (!pendingCallerLookups.has(caller.id)) {
        pendingCallerLookups.set(caller.id, new Set());
      }
      pendingCallerLookups.get(caller.id).add(response);
    }

    return response;
  }

  /**
   * Link up a caller with any pending responses
   * @param {Caller} caller
   */
  static linkCaller(caller) {
    const pendingResponses = pendingCallerLookups.get(caller.id);
    if (pendingResponses) {
      for (const response of pendingResponses) {
        response.caller = caller;
      }
      pendingCallerLookups.delete(caller.id);
    }
  }
}
