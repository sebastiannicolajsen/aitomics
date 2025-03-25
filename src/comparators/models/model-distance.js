import { ComparatorModel } from "./base.js";

/**
 * Distance is an adaptation of the following, i.e., 1 for identical answers, 0.5 for close answers (given metadata), 0 for unmatched.
 * if output is of type array, calculate for all elements in set, agreement is two-ways (i.e., disagreement when one party notices more occurences than the other, no matter who, is counted as unmatched if no closeness).
 * Thus, if an array is passed, the values which constitute the agreement (the average thereof) is n x m.
 * Based on:
 * Amanda Barany, Nidhi Nasiar, Chelsea Porter, Andres Felipe Zambrano, Alexandra L. Andres, Dara Bright, Mamta Shah, Xiner Liu, Sabrina Gao, Jiayi Zhang, Shruti Mehta, Jaeyoon Choi, Camille Giordano, and Ryan S. Baker. 2024. Chat-GPT for Education Research: Exploring the Potential of Large Language Models for Qualitative Codebook Development. In Artificial Intelligence in Education, Andrew M. Olney, Irene-Angelica Chounta, Zitao Liu, Olga C. Santos, and Ig Ibert Bittencourt (Eds.). Springer Nature Switzerland, Cham, 134–149.
 */
export class DistanceComparisonModel extends ComparatorModel {
  /**
   * Requires an ordered list of potential values to be able to compare distance, and the max distance to define closeness
   * @param {number} distance
   * @param {[string]} orderedList
   */
  constructor(distance, orderedList) {
    super();
    this.distance = distance;
    this.orderedList = orderedList;
  }

  /**
   * Execute a comparison between two inputs
   * @param {[string] | string} inputa
   * @param {[string] | string} inputb
   * @returns number (0-1)
   */
  run(inputa, inputb) {
    const a = inputa.length < inputb.length ? inputb : inputaa;
    const b = inputa.length < inputb.length ? inputa : inputb;

    let sum = 0;
    for (const e of a) {
      const start = this.orderedList.indexOf(e);
      let value = 0;
      for (const f of b) {
        if (this.orderedList[start] === f) {
          value = 1;
          break;
        }
        const prefix = start - this.distance < 0 ? 0 : start - this.distance;
        const suffix = start + this.distance;
        if (this.orderedList.slice(prefix, suffix).includes(f)) {
          value = 0.5;
          break;
        }
      }
      sum += value;
    }

    return sum / Math.max(a.length, b.length);
  }
}
