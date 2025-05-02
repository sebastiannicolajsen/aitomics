import { ComparisonModelBase } from "./models/index.js";
import { Response } from "../response/index.js";

/**
 * A comparison model which compares two Responses who have the same (root) input.
 */
export class ComparisonModel {
    /**
     * Create the comparison model for two responses, requires same (root) input in responses.
     * @param {Response} a 
     * @param {Response} b 
     */
  constructor(a, b) {
    if (!(a instanceof Response && b instanceof Response))
      throw new Error("Mismatch in comparison, requires two responses");
    if (a.rootInput() !== b.rootInput())
      throw new Error("Mismatch in comparison, not comparing same input");
    this.a = a;
    this.b = b;
  }

  /**
   * Pairs multiple Responses. Without match, the values are lost
   * @param {[Response]} a 
   * @param {[Response]} b 
   * @returns [ComparisonModel]
   */
  static match(a, b) {
    const aset = {};
    const bset = {};
    const res = [];

    const transform = (i, set) =>
      i.forEach((e) => {
        if (!(e instanceof Response))
          throw new Error("List contains non-response type");
        set[e.rootInput()] = e;
      });

    transform(a, aset);
    transform(b, bset);

    for (const k of Object.keys(aset)) {
      if (bset[k]) res.push(new ComparisonModel(aset[k], bset[k]));
    }

    return res;
  }

  /**
   * Compares the two Responses using the supplied comparison model
   * @param {ComparisonModelBase} model 
   * @returns comparison value (according to the individual comparison model)
   */
  run(model) {
    if (!(model instanceof ComparisonModelBase))
      throw new Error("Model must be a ComparisonModelBase");
    return model.compare(this.a, this.b);
  }

  /**
   * Compares two lists of responses using the supplied comparison model
   * @param {[Response]} responsesA First list of responses
   * @param {[Response]} responsesB Second list of responses
   * @param {ComparisonModelBase} model The model to use for comparison
   * @returns {number} The comparison result
   */
  static compareMultiple(responsesA, responsesB, model) {
    if (!Array.isArray(responsesA)) {
      throw new Error("First argument must be an array of responses");
    }
    if (!Array.isArray(responsesB)) {
      throw new Error("Second argument must be an array of responses");
    }
    if (!(model instanceof ComparisonModelBase))
      throw new Error("Model must be a ComparisonModelBase");

    // Extract outputs from responses
    const outputsA = responsesA.map(r => r.output);
    const outputsB = responsesB.map(r => r.output);

    return model.run(outputsA, outputsB);
  }
}
