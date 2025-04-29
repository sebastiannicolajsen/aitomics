/**
 * Used to determine comparison model used for responses
 */
export class ComparatorModel {
    /**
     * @param {boolean} isMultipleComparison Whether this model is designed for multiple comparisons
     */
    constructor(isMultipleComparison = false) {
        this.isMultipleComparison = isMultipleComparison;
    }
 
    /**
     * Execute a comparison between two inputs
     * @param {[string] | string} inputa 
     * @param {[string] | string} inputb 
     */
    run(inputa, inputb){
        throw new Error("'run' must be implemented")
    }
}