import { ComparatorModel } from "./base.js";

/**
 * Calculates Krippendorff's alpha between two responses
 */
export class KrippendorffsComparisonModel extends ComparatorModel {
  /**
   * @param {[string]} labels The list of possible labels
   * @param {Function} [weightFn] Optional function to determine weight between two labels (k,l). Defaults to 1 for identical, 0 for different
   */
  constructor(labels, weightFn) {
    super(true);
    this.labels = labels;
    this.weightFn = weightFn || ((k, l) => (k === l ? 1 : 0));
  }

  /**
   * Execute a comparison between two inputs
   * @param {[string] | string} inputa 
   * @param {[string] | string} inputb 
   * @returns number (0-1)
   */
  run(inputa, inputb) {
    const reviewers = [inputa, inputb];
    return this.calculateKrippendorffsAlpha(this.labels, reviewers, this.weightFn);
  }

  /**
   * Calculates Krippendorff's alpha between multiple reviewers
   * @param {[string]} labels The list of possible labels
   * @param {[[null | string]]} reviewers Lists of either null if no label given, string with label if given
   * @param {Function} w Function which weighs the two labels (k,l) against each other (by returning a number 0-1)
   * @returns {number} Krippendorff's alpha score (0-1)
   */
  calculateKrippendorffsAlpha(labels, reviewers, w) {
    // helper function for label access
    const l = (r, f) => r.map((r) => r.map(f));
    const isnull = (l) => !l || l.filter((l) => l).length === 0;

    // turn everything into arrays to support multi labels
    reviewers = l(reviewers, (l) => (Array.isArray(l) ? l : [l]));
    // replace faulty values with null
    reviewers = l(reviewers, (l) =>
      l.map((v) => (v && labels.includes(v) ? v : null))
    );
    // identify faulty indices
    let faults = l(reviewers, (l, index) => (isnull(l) ? index : null))
      .reduce((s, a) => [...s, ...a], [])
      .filter((v) => v);

    // check which ones are actually faulty across reviewers (i.e., not enough reviews to keep)
    faults = faults
      .map((f) =>
        reviewers.map((r) => !isnull(r[f])).filter((v) => !v).length >= 2
          ? null
          : f
      )
      .filter((v) => v);

    // remove faults from all
    faults.forEach((f) => reviewers.forEach((r) => r.splice(f, 1)));

    // decide n
    const n = Math.max(...reviewers.map((r) => r.length));

    // build list of area ids (i)
    const nlist = [];
    for (let i = 0; i < n; i++) nlist.push(i);
    // list of labels
    const q = labels;
    // table for labels (l) on areas (i)
    let r = {};

    // populate r table for all reviewers
    for (const i of nlist) {
      r[i] = {};
      for (const l of q) if (!r[i][l]) r[i][l] = 0;

      for (const rev of reviewers) {
        if (!rev[i]) continue; // skip empty
        for (const ele of rev[i]) if (ele) r[i][ele]++; // only add if not null and exists in list
      }
    }

    // total # of labels for area (i)
    let ri = (i) => q.reduce((s, l) => s + r[i][l], 0);
    // total # of labels (count number of labels not null)
    let rsum = reviewers
      .map((rev) =>
        rev.reduce(
          (s, v) => s + v.filter((v) => v !== null && v !== undefined).length,
          0
        )
      )
      .reduce((s, a) => s + a, 0);
    // average of codes for each area (always just the ratings divided by areas)
    const ravg = rsum / n;

    // iterates all labels of area `i` producing `weight (0-1)` * `occurences`.
    const r_ik = (i, k) => q.reduce((s, l) => s + w(k, l) * r[i][l], 0);
    // produce percentage agreement for single area (i) and single rating
    const p_aik = (i, k) => (r[i][k] * (r_ik(i, k) - 1)) / (ravg * (ri(i) - 1));

    // percentage agreement for single area (i), across all labels
    const p_ai = (i) => q.reduce((s, k) => s + p_aik(i, k), 0);

    // produce average agreement percentage for all stores
    const p_amark = nlist.reduce((s, i) => s + p_ai(i), 0) / n;

    // calculate overall observed agreement:
    const p_a = p_amark * (1 - 1 / (n * ravg)) + 1 / (n * ravg);

    // the classification probability for category k
    const pi = (k) => nlist.reduce((s, i) => s + r[i][k], 0) / rsum;

    // iterate all combinations without duplicate pairs to find the percent agreement expected by chance
    let p_e = 0;
    for (let k = 0; k < q.length; k++) {
      for (let l = k; l < q.length; l++) {
        p_e += w(l, k) * pi(q[k]) * pi(q[l]);
      }
    }

    // calculate actual alpha:
    const alpha = (p_a - p_e) / (1 - p_e);
    const floored = Math.floor(alpha * 1000) / 1000;

    // format to three decimals
    return floored;
  }
} 