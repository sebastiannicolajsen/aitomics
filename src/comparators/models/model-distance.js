import { ComparisonModelBase } from "./base.js";

/**
 * Calculates similarity between two responses based on their positions in an ordered list.
 * Returns a value between 0 and 1 representing the weighted average of element matches:
 * - 1.0 means all elements are identical
 * - 0.5 means elements are within the specified distance threshold
 * - 0.0 means elements are beyond the distance threshold or not in the ordered list
 * 
 * The model requires an ordered list of possible values and a distance threshold.
 * Elements are compared based on their positions in this list, allowing for
 * "close" matches to be counted as partial agreements.
 * 
 * For arrays of different lengths, the comparison is based on the longer array,
 * with missing elements counting as mismatches.
 * 
 * Based on:
 * Amanda Barany, Nidhi Nasiar, Chelsea Porter, Andres Felipe Zambrano, Alexandra L. Andres, Dara Bright, Mamta Shah, Xiner Liu, Sabrina Gao, Jiayi Zhang, Shruti Mehta, Jaeyoon Choi, Camille Giordano, and Ryan S. Baker. 2024. Chat-GPT for Education Research: Exploring the Potential of Large Language Models for Qualitative Codebook Development. In Artificial Intelligence in Education, Andrew M. Olney, Irene-Angelica Chounta, Zitao Liu, Olga C. Santos, and Ig Ibert Bittencourt (Eds.). Springer Nature Switzerland, Cham, 134–149.
 */
export class DistanceComparisonModel extends ComparisonModelBase {
  /**
   * Requires an ordered list of potential values to be able to compare distance, and the max distance to define closeness
   * @param {number} distance
   * @param {[string]} orderedList
   * @param {Function} [weightFn] Optional function to determine weight between two values. Defaults to 1 for identical, 0.5 for close, 0 for unmatched
   */
  constructor(distance, orderedList, weightFn) {
    super();
    this.distance = distance;
    this.orderedList = orderedList;
    this.weightFn = weightFn || ((k, l) => {
      if (k === l) return 1;
      const kIndex = this.orderedList.indexOf(k);
      const lIndex = this.orderedList.indexOf(l);
      if (kIndex === -1 || lIndex === -1) return 0;
      const dist = Math.abs(kIndex - lIndex);
      return dist <= this.distance ? 0.5 : 0;
    });
  }

  /**
   * Execute a comparison between two inputs
   * @param {[string] | string} inputa
   * @param {[string] | string} inputb
   * @returns number (0-1)
   */
  run(inputa, inputb) {
    // Special case: empty arrays are considered identical
    if (inputa.length === 0 && inputb.length === 0) {
      return 1.0;
    }

    // Ensure a is the longer array and b is the shorter array
    const a = inputa.length >= inputb.length ? inputa : inputb;
    const b = inputa.length >= inputb.length ? inputb : inputa;

    // First check if any elements match at all
    let hasAnyMatch = false;
    for (const e of a) {
      for (const f of b) {
        if (this.weightFn(e, f) > 0) {
          hasAnyMatch = true;
          break;
        }
      }
      if (hasAnyMatch) break;
    }

    // If no elements match at all, return 0
    if (!hasAnyMatch) return 0;

    // Calculate the average weight for matching elements
    let sum = 0;
    const usedB = new Set(); // Track which elements in b have been used

    for (const e of a) {
      let maxWeight = 0;
      let bestMatch = null;

      // Find the best unused match in b
      for (const f of b) {
        if (!usedB.has(f)) {
          const weight = this.weightFn(e, f);
          if (weight > maxWeight) {
            maxWeight = weight;
            bestMatch = f;
          }
        }
      }

      // If we found a match, mark it as used
      if (bestMatch !== null) {
        usedB.add(bestMatch);
      }
      sum += maxWeight;
    }

    return sum / a.length;
  }

  /**
   * Compares two responses using distance-based comparison.
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

    // Convert all values to strings for comparison
    const aStr = a.map(v => String(v));
    const bStr = b.map(v => String(v));

    // Use the run method to perform the actual comparison
    return this.run(aStr, bStr);
  }
}
