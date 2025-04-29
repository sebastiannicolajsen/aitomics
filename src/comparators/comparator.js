import { Response } from "../response/index.js";
import { ComparatorModel } from "./models/index.js";

/**
 * A comparator which compares two Responses who have the same (root) input.
 */
export class Comparator {
    /**
     * Create the comparator for two responses, requires same (root) input in responses.
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
   * @returns [Comparator]
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
      if (bset[k]) res.push(new Comparator(aset[k], bset[k]));
    }

    return res;
  }

  /**
   * Compares the two Responses using the supplied comparator model
   * @param {ComparatorModel} model 
   * @returns comparison value (according to the individual comparator model)
   */
  run(model) {
    if (!(model instanceof ComparatorModel))
      throw new Error("Not providing comparator model");
    if (model.isMultipleComparison)
      throw new Error("This model is designed for multiple comparisons, use compareMultiple instead");
    const inputa = Array.isArray(this.a.output)
      ? this.a.output
      : [this.a.output];
    const inputb = Array.isArray(this.b.output)
      ? this.b.output
      : [this.b.output];
    return model.run(inputa, inputb);
  }

  /**
   * Compares two lists of responses using the supplied comparator model
   * @param {[Response]} responsesA First list of responses
   * @param {[Response]} responsesB Second list of responses
   * @param {ComparatorModel} model The model to use for comparison
   * @returns {number} The comparison result
   */
  static compareMultiple(responsesA, responsesB, model) {
    if (!Array.isArray(responsesA) || !Array.isArray(responsesB))
      throw new Error("Both arguments must be arrays of responses");
    if (!(model instanceof ComparatorModel))
      throw new Error("Not providing comparator model");
    if (!model.isMultipleComparison)
      throw new Error("This model is not designed for multiple comparisons, use run instead");

    // Validate that all elements are Response objects
    responsesA.forEach((r, i) => {
      if (!(r instanceof Response))
        throw new Error(`Element at index ${i} in first array is not a Response object`);
    });
    responsesB.forEach((r, i) => {
      if (!(r instanceof Response))
        throw new Error(`Element at index ${i} in second array is not a Response object`);
    });

    // Match the responses using the existing match method
    const pairs = Comparator.match(responsesA, responsesB);
    
    if (pairs.length === 0)
      throw new Error("No matching responses found between the two lists");

    // Extract outputs from matched pairs
    const outputsA = pairs.map(pair => pair.a.output);
    const outputsB = pairs.map(pair => pair.b.output);

    // Let the model handle the aggregation
    return model.run(outputsA, outputsB);
  }
}
