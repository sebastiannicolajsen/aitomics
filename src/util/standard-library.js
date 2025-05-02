import { ProgrammaticCaller } from "../callers/caller-programmatic.js";
import { $ } from "../callers/caller-utils.js"
import hash from "hash-it"

/**
 * Provides a set of standard callers including the ability to compose them.
 */
export const _ = {
    compose: (...all) => {
      const f = all.reduce(
        (s, a) => async (v) => await a.run(await s(v)),
        async (v) => v
      );
  
      return new ProgrammaticCaller(f, hash(all));
    },
    stringToJSON: $((i) => JSON.parse(i), "aitomic.stringToJSON"),
    JSONToString: $((i) => JSON.stringify(i), "aitomic.JSONToString"),
    lowerCase: $((a) => a.toLowerCase(), "aitomic.lowerCase"),
    upperCase: $((a) => a.toUpperCase(), "aitomic.upperCase"),
    id: $((i) => i, "aitomic.id")
  };

