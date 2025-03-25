import { ComparatorModel } from "./base.js"

/**
 * Calculates agreement (when exact matches) between two responses, with both responses weighing equally. 
 * Thus, if an array is passed, the values which constitute the agreement (the average thereof) is n x m (i.e., size of potential disagreements).
 */
export class EqualComparisonModel extends ComparatorModel {
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
  }