import { ComparisonModelBase } from "./base.js";
import { Response } from "../../response/index.js";

/**
 * Calculates Cohen's kappa between two responses
 */
export class CohensComparisonModel extends ComparisonModelBase {
  constructor(value) {
    super(true);
    this.value = String(value);
  }

  /**
   * Execute a comparison between two inputs
   * @param {[string]} inputa 
   * @param {[string]} inputb 
   * @returns number (0-1)
   */
  run(inputa, inputb) {
    // Convert all numeric values to strings, handling arrays recursively
    const convertToString = (arr) => arr.map(v => {
      if (v === null || v === undefined) return v;
      if (Array.isArray(v)) return convertToString(v);
      return String(v);
    });
    return this.calculateCohensKappa(this.value, convertToString(inputa), convertToString(inputb));
  }

  /**
   * Calculates Cohen's Kappa between two sets of responses
   * @param {string} value The value to check for agreement
   * @param {[string]} p1 First set of responses
   * @param {[string]} p2 Second set of responses
   * @returns {number} Cohen's Kappa score (0-1)
   */
  calculateCohensKappa(value, p1, p2) {
    // Map to outputs, handling both Response objects and direct values
    p1 = p1.map(e => e instanceof Response ? e.output : e);
    p2 = p2.map(e => e instanceof Response ? e.output : e);

    let TP = 0; // agreement with label
    let TN = 0; // agreement without label
    let FN = 0; // false negatives
    let FP = 0; // False positives
    let N = 0; // total

    for(let i = 0; i < p1.length; i++){
      // Handle both string and array outputs
      const v1 = Array.isArray(p1[i]) ? p1[i].includes(value) : p1[i] === value;
      const v2 = Array.isArray(p2[i]) ? p2[i].includes(value) : p2[i] === value;

      if(v1 && v2) TP++ // if there is shared agreement
      else if(!v1 && !v2) TN++ // if there is shared disagreement
      else if(v1 && !v2) FN++ // false negative
      else if(!v1 && v2) FP++ // false positive

      N++; //now one more case
    }

    // Handle case where there are no samples
    if (N === 0) return 1;  // Empty sets are in perfect agreement

    const P0 = (TP + TN) / N;
    
    const P1 = ((TP + FN) * (TP + FP)) / (N * N);
    const P2 = ((TN + FN) * (TN + FP)) / (N * N);

    const Pe = P1 + P2; // chance agreement

    // Handle case where chance agreement is 1 (perfect agreement by chance)
    if (Pe === 1) {
      // If there's perfect agreement (P0 = 1), return 1
      // Otherwise, return 0 (agreement no better than chance)
      return P0 === 1 ? 1 : 0;
    }

    const kappa = (P0 - Pe) / (1 - Pe);

    // Round to 2 decimal places
    return Math.round(kappa * 100) / 100;
  }

  /**
   * Compares two responses using Cohen's Kappa.
   * @param {Response} responseA - First response to compare.
   * @param {Response} responseB - Second response to compare.
   * @returns {ComparisonResult} The comparison result.
   */
  compare(responseA, responseB) {
    // ... existing code ...
  }
} 