import { Response, generatingType } from "../response/index.js";
import { Caller } from "../callers/base.js"

/**
 * An IdentityCaller which just rewraps / wraps the input in a response, specifies the generating type as 'generatingType.input'
 */
export class IdentityCaller extends Caller {
    constructor(){
      super("aitomic.identityCaller")
    }
  
    /**
     * Simply provides the input wrapped in a response
     * @param {Response | string} content 
     * @returns Response
     */
    async run(content){
      let input = content;
      if(content instanceof Response){
        input = content.output;
      }
      return new Response(input, this, content, generatingType.INPUT)
    }
  }
  