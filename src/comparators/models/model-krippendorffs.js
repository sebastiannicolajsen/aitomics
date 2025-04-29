import { ComparatorModel } from "./base.js";

/**
 * Calculates Krippendorff's alpha between multiple reviewers' responses.
 * 
 * This model implements a hybrid approach to handle both single-label and multi-label data:
 * - **Single-Label Data:** Uses the standard Krippendorff's alpha calculation for nominal data,
 *   allowing for weighted agreement between labels using the provided `weightFn` (e.g., for numeric/ordinal data).
 * - **Multi-Label Data:** Detects if any reviewer provides multiple labels for any item.
 *   If so, it calculates observed agreement (p_a) using the Jaccard Index between the sets of labels
 *   provided by pairs of reviewers for each item. The provided `weightFn` is *ignored* in this path.
 * 
 * **Note on Multi-Label Approximation:** While the Jaccard index handles the structure of multi-label
 * comparison for observed agreement, the expected agreement (p_e) calculation uses a simplified
 * approach (sum of squared individual label probabilities) for both paths. This means the alpha
 * value for multi-label data is an *approximation* and not strictly equivalent to more complex
 * multi-label Krippendorff extensions.
 */
export class KrippendorffsComparisonModel extends ComparatorModel {
  /**
   * @param {[string | number]} labels The list of possible labels (will be converted to strings).
   * @param {Function} [weightFn] Optional function `(k, l) => number` returning a value between 0 and 1
   *                            to determine the agreement weight between two labels k and l.
   *                            Defaults to identity (1 for identical, 0 for different).
   *                            **This function is only used for single-label data.**
   */
  constructor(labels, weightFn) {
    super(true);
    // Convert all labels to strings
    this.labels = labels.map(l => String(l));
    // Restore weight function that handles numeric distance
    this.weightFn = weightFn || ((k, l) => {
      // Convert to numbers for comparison
      const kNum = Number(k);
      const lNum = Number(l);
      // If either is NaN, fall back to exact string match
      if (isNaN(kNum) || isNaN(lNum)) return k === l ? 1 : 0;
      // For numeric values, give partial credit based on distance
      const diff = Math.abs(kNum - lNum);
      return diff === 0 ? 1 : diff === 1 ? 0.5 : 0;
    });
  }

  /**
   * Execute the comparison between two lists of reviewer inputs.
   * @param {Array<string | number | Array<string | number>>} inputa Reviewer A's labels for each item.
   * @param {Array<string | number | Array<string | number>>} inputb Reviewer B's labels for each item.
   * @returns {number} Krippendorff's alpha score (or approximation for multi-label).
   */
  run(inputa, inputb) {
    // Convert all numeric values to strings, handling arrays recursively
    // Note: This recursive conversion might not be strictly necessary anymore due to internal string conversion,
    // but kept for robustness / potential direct use.
    const convertToString = (arr) => arr.map(v => {
      if (v === null || v === undefined) return v;
      if (Array.isArray(v)) return convertToString(v);
      return String(v);
    });
    const reviewers = [convertToString(inputa), convertToString(inputb)];
    return this.calculateKrippendorffsAlpha(this.labels, reviewers, this.weightFn);
  }

  /**
   * Calculates Krippendorff's alpha using a hybrid approach.
   * - Detects single vs. multi-label data based on input structure.
   * - Uses Jaccard index for observed agreement (p_a) in multi-label cases (ignoring weightFn).
   * - Uses original weighted formula for p_a in single-label cases (using weightFn).
   * - Uses simplified expected agreement (p_e) for both cases.
   *
   * NOTE: The expected agreement (p_e) calculation is a simplification and not strictly consistent
   *       with either the Jaccard-based or weighted observed agreement (p_a), making the result
   *       an approximation, especially for multi-label data.
   *
   * @param {[string]} labels The list of possible labels (already stringified).
   * @param {[[Array<string>]]} reviewers Preprocessed list where each reviewer has an array of items,
   *                                     and each item contains an array of 0 or more valid string labels.
   * @param {Function} w The weight function `(k, l) => number` (only used for single-label path).
   * @returns {number} Krippendorff's alpha score approximation (potentially NaN).
   */
  calculateKrippendorffsAlpha(labels, reviewers, w) {

    // Helper function for Jaccard Index (used in multi-label path)
    const calculateJaccard = (setA, setB) => {
        setA = new Set(setA || []);
        setB = new Set(setB || []);
        const intersection = new Set([...setA].filter(x => setB.has(x)));
        const union = new Set([...setA, ...setB]);
        return union.size === 0 ? 1 : intersection.size / union.size;
    };

    // --- Preprocessing ---
    const numReviewers = reviewers.length;
    if (numReviewers < 2) return NaN;

    const q = labels.map(lbl => String(lbl)); // Use q for stringified labels
    let isMultiLabel = false;

    // Turn reviewer data into arrays of valid strings, filtering invalid labels
    // Also detect if any entry is multi-label
    reviewers = reviewers.map(reviewerData =>
        (reviewerData || []).map(itemLabels => {
            const labelsArray = (Array.isArray(itemLabels) ? itemLabels : [itemLabels])
                .map(v => {
                    const s = v !== null && v !== undefined ? String(v) : null;
                    return s && q.includes(s) ? s : null;
                })
                .filter(v => v !== null);

            if (labelsArray.length > 1) {
                isMultiLabel = true;
            }
            return labelsArray;
        })
    );

    // Filter out items where fewer than 2 reviewers provided any valid labels
    const itemsToRemove = [];
    const initialN = reviewers[0]?.length || 0;
    for (let i = 0; i < initialN; i++) {
        let validReviewersForItem = 0;
        for (let j = 0; j < numReviewers; j++) {
            if (reviewers[j][i] && reviewers[j][i].length > 0) {
                validReviewersForItem++;
            }
        }
        if (validReviewersForItem < 2) {
            itemsToRemove.push(i);
        }
    }
    for (let i = itemsToRemove.length - 1; i >= 0; i--) {
        const indexToRemove = itemsToRemove[i];
        for (let j = 0; j < numReviewers; j++) {
            reviewers[j].splice(indexToRemove, 1);
        }
    }

    const n = reviewers[0]?.length || 0;
    if (n === 0) return NaN;

    // --- Observed Agreement (p_a) --- 
    let p_a = 0;

    if (isMultiLabel) {
        // --- Multi-Label Path (Jaccard) ---
        let totalObservedAgreement = 0;
        for (let i = 0; i < n; i++) { // For each item
            let itemPairAgreementSum = 0;
            let pairCount = 0;
            for (let j = 0; j < numReviewers; j++) { // For each pair of reviewers
                for (let k = j + 1; k < numReviewers; k++) {
                    itemPairAgreementSum += calculateJaccard(reviewers[j][i], reviewers[k][i]);
                    pairCount++;
                }
            }
            totalObservedAgreement += itemPairAgreementSum / pairCount;
        }
        p_a = totalObservedAgreement / n;

    } else {
        // --- Single-Label Path (Original Krippendorff with weights) ---
        // Reconstruct contingency table r[item][label] = count
        let r = {}; 
        for (let i = 0; i < n; i++) {
            r[i] = {};
            q.forEach(lbl => r[i][lbl] = 0);
            for (let j = 0; j < numReviewers; j++) {
                const label = reviewers[j][i][0]; // Single label guaranteed
                if (label) { // Check if a valid label exists for this reviewer/item
                   r[i][label]++;
                }
            }
        }

        // Calculate p_a using the original formula with weights
        const ri = (i) => q.reduce((s, l) => s + (r[i][l] || 0), 0);
        const rsum = Array.from({ length: n }).reduce((sum, _, i) => sum + ri(i), 0);
        if (rsum === 0) return NaN; // Avoid division by zero if no labels anywhere
        const ravg = rsum / n; // Avg labels per item (should be <= numReviewers)
        if (ravg === 0) return NaN;

        // Observed disagreement calculation for pairwise agreement within items
        let total_p_ai = 0;
        for (let i = 0; i < n; i++) {
            let item_disagreement = 0;
            const numLabelsInItem = ri(i);
            if (numLabelsInItem >= 2) { // Agreement requires at least 2 labels
                for (let k_idx = 0; k_idx < q.length; k_idx++) {
                  for (let l_idx = k_idx; l_idx < q.length; l_idx++) {
                      const label_k = q[k_idx];
                      const label_l = q[l_idx];
                      const count_k = r[i][label_k] || 0;
                      const count_l = r[i][label_l] || 0;
                      const weight = 1.0 - w(label_k, label_l); // Use disagreement weight
                      if (k_idx === l_idx) {
                          item_disagreement += count_k * (count_k - 1) * weight;
                      } else {
                          item_disagreement += count_k * count_l * weight * 2; // Multiply by 2 for distinct pairs
                      }
                  }
                }
                // Normalize by total possible pairs within the item
                total_p_ai += item_disagreement / (numLabelsInItem * (numLabelsInItem - 1));
            }
            // If numLabelsInItem < 2, disagreement is 0 for this item
        }
        const Do = total_p_ai / n; // Average observed disagreement
        p_a = 1.0 - Do; // Observed agreement
    }

    // --- Expected Agreement (p_e) - Using simple sum of squared probabilities ---
    // (Same calculation for both paths, based on overall label distribution)
    const labelCounts = {};
    q.forEach(lbl => labelCounts[lbl] = 0);
    let totalLabelAssignments = 0;
    for (let j = 0; j < numReviewers; j++) {
        for (let i = 0; i < n; i++) {
            (reviewers[j][i] || []).forEach(lbl => {
                labelCounts[lbl]++;
                totalLabelAssignments++;
            });
        }
    }

    const pi = (k) => (totalLabelAssignments === 0) ? 0 : (labelCounts[k] || 0) / totalLabelAssignments;
    let p_e = 0;
    for (const k of q) {
        p_e += pi(k) * pi(k);
    }

    // --- Final Alpha Calculation ---
    if (1 - p_e === 0) {
        return (p_a === 1) ? 1.0 : NaN;
    }
    const alpha = (p_a - p_e) / (1 - p_e);

    /* // Optional Debug Logging 
    console.log(`\nKrippendorff's Alpha (${isMultiLabel ? 'Multi-Label Jaccard' : 'Single-Label Weighted'}) Debug Info:`);
    console.log("Number of items after filtering (n):", n);
    console.log("Is Multi-Label:", isMultiLabel);
    console.log("Observed agreement (p_a):", p_a);
    console.log("Expected agreement (p_e - sum pi(k)^2):", p_e);
    console.log("Total label assignments counted:", totalLabelAssignments);
    console.log("Label distribution (pi(k)):", q.map(k => `${k}: ${pi(k).toFixed(3)}`).join(", "));
    */

    return Math.floor(alpha * 1000) / 1000; // Format to three decimals
  }
} 