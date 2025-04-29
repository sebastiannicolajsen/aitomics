import { ComparisonModelBase } from "./base.js"

/**
 * Calculates agreement (when exact matches) between two responses, with both responses weighing equally. 
 * Thus, if an array is passed, the values which constitute the agreement (the average thereof) is n x m (i.e., size of potential disagreements).
 */
export class EqualComparisonModel extends ComparisonModelBase {
    constructor() {
      super()
    }
  
    /**
     * 
     * @param {[string] | string} inputa 
     * @param {[string] | string} inputb 
     * @returns number (0-1)
     */
    run(inputa, inputb){
      let seta = new Set(inputa)
      let setb = new Set(inputb)
      const int = inputa.filter(e => setb.has(e)).length
      const adis = inputa.filter(e => !(setb.has(e))).length
      const bdis = inputb.filter(e => !(seta.has(e))).length
  
      return int / (adis + bdis + int)
    }

    /**
     * Compares two responses using exact equality.
     * @param {Response} responseA - First response to compare.
     * @param {Response} responseB - Second response to compare.
     * @returns {number} The comparison result (0-1).
     */
    compare(responseA, responseB) {
      // Get the outputs from both responses
      const outputA = responseA.output;
      const outputB = responseB.output;

      // Handle both string and array outputs
      const a = Array.isArray(outputA) ? outputA : [outputA];
      const b = Array.isArray(outputB) ? outputB : [outputB];

      // Use the run method to perform the actual comparison
      return this.run(a, b);
    }
}