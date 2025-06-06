import { ComparisonModelBase } from "./base.js";

/**
 * Calculates Krippendorff's alpha between multiple reviewers' responses.
 * 
 * This implementation is based on the k-alpha calculator (https://github.com/davide-marchiori/k-alpha),
 * which provides a user-friendly tool for computing Krippendorff's alpha inter-rater reliability coefficient.
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
export class KrippendorffsComparisonModel extends ComparisonModelBase {
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
    // Default weight function for binary weights
    this.weightFn = weightFn || ((k, l) => k === l ? 1 : 0);
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
    let p_e = 0;  // Declare p_e here

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

        // Simplified expected agreement for multi-label
        const labelProbs = {};
        q.forEach(lbl => labelProbs[lbl] = 0);
        let totalLabels = 0;
        
        // Calculate label probabilities
        for (let j = 0; j < numReviewers; j++) {
            for (let i = 0; i < n; i++) {
                (reviewers[j][i] || []).forEach(lbl => {
                    labelProbs[lbl]++;
                    totalLabels++;
                });
            }
        }
        
        // Calculate expected agreement using label probabilities
        p_e = 0;
        if (totalLabels > 0) {
            q.forEach(lbl => {
                const prob = labelProbs[lbl] / totalLabels;
                p_e += prob * prob;
            });
        }

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

        // Observed agreement calculation for pairwise agreement within items
        let total_p_ai = 0;
        for (let i = 0; i < n; i++) {
            let item_agreement = 0;
            const numLabelsInItem = ri(i);
            if (numLabelsInItem >= 2) { // Agreement requires at least 2 labels
                for (let k_idx = 0; k_idx < q.length; k_idx++) {
                    for (let l_idx = k_idx; l_idx < q.length; l_idx++) {
                        const label_k = q[k_idx];
                        const label_l = q[l_idx];
                        const count_k = r[i][label_k] || 0;
                        const count_l = r[i][label_l] || 0;
                        const weight = w(label_k, label_l); // Use agreement weight directly
                        if (k_idx === l_idx) {
                            item_agreement += count_k * (count_k - 1) * weight;
                        } else {
                            item_agreement += count_k * count_l * weight * 2; // Multiply by 2 for distinct pairs
                        }
                    }
                }
                // Normalize by total possible pairs within the item
                total_p_ai += item_agreement / (numLabelsInItem * (numLabelsInItem - 1));
            }
            // If numLabelsInItem < 2, agreement is 0 for this item
        }
        p_a = total_p_ai / n; // Average observed agreement

        // Calculate expected agreement for single-label
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

        // Calculate expected agreement
        let expected_agreement = 0;
        const totalPairs = totalLabelAssignments * (totalLabelAssignments - 1);
        if (totalPairs > 0) {
            for (let k_idx = 0; k_idx < q.length; k_idx++) {
                for (let l_idx = k_idx; l_idx < q.length; l_idx++) {
                    const label_k = q[k_idx];
                    const label_l = q[l_idx];
                    const count_k = labelCounts[label_k] || 0;
                    const count_l = labelCounts[label_l] || 0;
                    const weight = w(label_k, label_l); // Use agreement weight directly
                    if (k_idx === l_idx) {
                        expected_agreement += count_k * (count_k - 1) * weight;
                    } else {
                        expected_agreement += count_k * count_l * weight * 2; // Multiply by 2 for distinct pairs
                    }
                }
            }
            p_e = expected_agreement / totalPairs;
        }
    }

    // --- Final Alpha Calculation ---
    if (1 - p_e === 0) {
        return (p_a === 1) ? 1.0 : NaN;
    }
    const alpha = (p_a - p_e) / (1 - p_e);

    // Round to 3 decimal places, handling floating-point precision
    return Math.round(alpha * 1000) / 1000;
  }

  /**
   * Compares two responses using Krippendorff's Alpha.
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