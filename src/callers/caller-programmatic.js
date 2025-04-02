import hash from 'hash-it';
import { Response } from "../response/index.js";
import { Caller } from "./base.js";

/**
 * A programmatic Caller, allowing to pass functions as first argument to the constructor. The function is applied to produce 
 */
export class ProgrammaticCaller extends Caller {
  constructor(fun, id = hash(fun)) {
    super(id);
    this.fun = fun;
  }

  /**
   * Executes the transformation of the ProgrammaticCaller
   * @param {Response | string} content 
   * @returns Response
   */
  async run(content) {
    let input = content;
    if (content instanceof Response) {
      input = content.output;
    } else if (typeof content !== "string" && !(content instanceof String)) {
      if (typeof content === "promise")
        throw new Error("Unresolved future as input");
      throw new Error(`Illegal input type '${content}'`);
    }
    let result = null;
    try {
      result = await this.fun(input);
    } catch(e){
      const root = content instanceof Response ? content.rootInput() : content
      throw new Error(`Failed executing '${this.id}' for (root) input '${root}': ${e.message} `)
    }
    
    if (result instanceof Response) return result;
    return new Response(result, this, content);
  }

  /**
   * Compares this and another caller
   * @param {Object | Caller} caller
   * @returns boolean
   */
  equals(obj) {
    return obj instanceof ProgrammaticCaller && this.id === obj.id;
  }
}