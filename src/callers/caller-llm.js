import hash from 'hash-it';
import { fetch } from "../util/fetch/index.js";
import { Response } from "../response/index.js";
import { Caller } from "./base.js";

const format = (content, role) => ({ role, content });

/**
 * Default Caller to construct LLM calls (using run). Receives system messages through context parameter (either as single string or array).
 */
export class LLMCaller extends Caller {
    constructor(context, id = hash(context)) {
      super(id);
      if (!Array.isArray(context)) context = [context];
      this.context = context; // for retrieval
      this._context = context.map((c) => format(c, "system")); // for system
    }
  
    /**
     * Execute the transformation of the LLMCaller, returning a Response
     * @param {Response | string} content 
     * @returns Response
     */
    async run(content) {
      let input = content;
      if (content instanceof Response) {
        input = content.output;
      } else if (typeof content !== "string" && !(content instanceof String) && typeof content !== "number") {
        throw new Error(`Illegal input type '${content}'`);
      }
      const output = await fetch(input, this._context);
      return new Response(output, this, content);
    }
  
    /**
     * Get total number of tokens of prompt
     * @returns int
     */
    tokens() {
      let sum = 0;
      for (const item of this.context) sum += item.length;
      return sum;
    }
  
    /**
     * Compares this and another object
     * @param {Object | Caller} caller 
     * @returns boolean
     */
    equals(obj) {
      return obj instanceof LLMCaller && this.id === obj.id;
    }
  }