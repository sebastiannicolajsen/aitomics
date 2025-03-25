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
        set[e.input] = e;
      });

    transform(a, aset);
    transform(b, bset);

    for (const k of Object.keys(aset)) {
      if (bset[k]) res.append(new Comparator(aset[k], bset[k]));
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
    const inputa = Array.isArray(this.a.output)
      ? this.a.output
      : [this.a.output];
    const inputb = Array.isArray(this.b.output)
      ? this.b.output
      : [this.b.output];
    return model.run(inputa, inputb);
  }
}
