import { ComparisonModelBase } from "./base.js"

/**
 * Calculates exact equality between two responses by comparing elements at each position.
 * Returns a value between 0 and 1 representing the proportion of matching elements:
 * - 1.0 means all elements match exactly
 * - 0.0 means no elements match
 * - Values in between represent partial matches (e.g., 0.6 means 3 out of 5 elements match)
 * 
 * For arrays of different lengths, the comparison is based on the maximum length,
 * with missing elements counting as mismatches.
 */
export class EqualComparisonModel extends ComparisonModelBase {
    constructor() {
      super()
    }
  
    /**
     * Helper function to check if two values are equal, handling nested arrays
     * @param {any} a First value to compare
     * @param {any} b Second value to compare
     * @returns {boolean} True if values are equal
     */
    areEqual(a, b) {
      // Handle arrays
      if (Array.isArray(a) && Array.isArray(b)) {
        // Empty arrays are considered equal
        if (a.length === 0 && b.length === 0) return true;
        if (a.length !== b.length) return false;
        // For arrays, check if they contain the same elements
        // Convert arrays to strings for comparison to handle nested arrays
        const aStr = JSON.stringify(a.sort());
        const bStr = JSON.stringify(b.sort());
        return aStr === bStr;
      }
      // Handle non-array values
      return a === b;
    }

    /**
     * 
     * @param {[string] | string} inputa 
     * @param {[string] | string} inputb 
     * @returns number (0-1)
     */
    run(inputa, inputb) {
      // Special case: empty arrays are considered identical
      if (inputa.length === 0 && inputb.length === 0) {
        return 1.0;
      }

      // Convert to sets for efficient lookup of non-array values
      let seta = new Set(inputa.filter(x => !Array.isArray(x)))
      let setb = new Set(inputb.filter(x => !Array.isArray(x)))

      // Find elements that exist in both arrays
      const commonElements = inputa.filter(e => {
        if (Array.isArray(e)) {
          // For arrays, find a matching array in inputb
          return inputb.some(f => Array.isArray(f) && this.areEqual(e, f));
        }
        return setb.has(e);
      });

      const uniqueToA = inputa.filter(e => {
        if (Array.isArray(e)) {
          // For arrays, check if there's no matching array in inputb
          return !inputb.some(f => Array.isArray(f) && this.areEqual(e, f));
        }
        return !setb.has(e);
      });

      const uniqueToB = inputb.filter(e => {
        if (Array.isArray(e)) {
          // For arrays, check if there's no matching array in inputa
          return !inputa.some(f => Array.isArray(f) && this.areEqual(e, f));
        }
        return !seta.has(e);
      });

      // If there are no common elements, return 0
      if (commonElements.length === 0) {
        return 0
      }

      // Calculate agreement based on matching elements
      // We want the ratio of matching elements to the total number of positions
      const totalPositions = Math.max(inputa.length, inputb.length)
      return commonElements.length / totalPositions
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