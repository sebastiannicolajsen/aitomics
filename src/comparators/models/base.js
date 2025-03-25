
/**
 * Used to determine comparison model used for responses
 */
export class ComparatorModel {
 
    /**
     * Execute a comparison between two inputs
     * @param {[string] | string} inputa 
     * @param {[string] | string} inputb 
     */
    run(inputa, inputb){
        throw new Error("'run' must be implemented")
    }
}