export const existingCallers = {};

/**
 * Base class of a Caller, all callers should extend this and have an async run(contet) method.
 */
export class Caller {
    /**
     * Construct a caller, takes a unique id to track Callers.
     * @param {string} id 
     */
    constructor(id) {
      if (existingCallers[id]) throw new Error(`Duplicate Caller entry (${id})`);
      this.id = id;
      existingCallers[id] = this;
      this._store = []
    }

    #store(response){
      this._store.push(response)
    }

    getAllResponses(){
      return this._store
    }

    /**
     * Executes the transformation of the Caller, and returns a Response.
     * @param {Response | string} content 
     * @returns Response
     */
    async run(content){
        throw new Error("Method 'run' must be implemented")
    }
  }