import { $, ProgrammaticCaller } from "./analysis.js";
import hash from "hash-it"

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
    upperCase: $((a) => a.toUpperCase(), "aitomic.upperCase")
  };

