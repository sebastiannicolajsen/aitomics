import axios from "axios";
import hash from "hash-it";
import { loadFromFile, validateObject } from "./helper.js";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const CONFIG_FILE = "default-config.yml";

const requiredSchema = {
  model: { type: String, required: true },
  path: { type: String, required: true },
  port: { type: Number, required: true },
  endpoint: { type: String, required: true },
  settings: {
    temperature: { type: Number, required: true },
    max_tokens: { type: Number, required: true },
    stream: { type: Boolean, required: true },
    required: true,
  },
};

let llm_config = loadFromFile(CONFIG_FILE, requiredSchema);

const existingCallers = {};

export const type = Object.freeze({
  PROGRAMMATIC: Symbol("generator.programmatic"),
  INPUT: Symbol("generator.input"),
});

export class Response {
  constructor(output, caller, input, generator = type.PROGRAMMATIC) {
    this.output = output;
    if (!(caller instanceof Caller))
      throw new Error("Not a proper caller type");
    this.caller = caller;
    this.input = input;
    this.generator = generator;
    this.root = !(input instanceof Response);
    this.level = this.root ? 1 : this.input.level + 1;
  }

  equals(response) {
    return (
      response instanceof Response &&
      this.input === response.input &&
      this.caller === response.caller
    );
  }

  rootInput(){
    let curr = this;
    while (typeof curr !== "string") {
      curr = curr.input;
    }
    return curr;
  }

  toString() {
    return `[${this.caller.id}]: '${this.output}' (${this.level})`;
  }

  toStringExpanded(newline = true) {
    let str = "";
    let curr = this;
    while (typeof curr !== "string") {
      str += curr + (newline ? "\n" : "");
      curr = curr.input;
    }
    return str;
  }

  compare(b) {
    return new Comparator(this, b);
  }

  static parse(obj) {
    return Object.assign(new Response(), obj);
  }
}

class ComparatorModel {}

// Distance is an adaptation of the following, i.e., 1 for identical answers, 0.5 for close answers (given metadata), 0 for unmatched.
// if output is of type array, calculate for all elements in set, agreement is two-ways (i.e., disagreement when one party notices more occurences than the other, no matter who, is counted as unmatched if no closeness).
// Thus, if an array is passed, the values which constitute the agreement (the average thereof) is n x m
// Amanda Barany, Nidhi Nasiar, Chelsea Porter, Andres Felipe Zambrano, Alexandra L. Andres, Dara Bright, Mamta Shah, Xiner Liu, Sabrina Gao, Jiayi Zhang, Shruti Mehta, Jaeyoon Choi, Camille Giordano, and Ryan S. Baker. 2024. Chat-GPT for Education Research: Exploring the Potential of Large Language Models for Qualitative Codebook Development. In Artificial Intelligence in Education, Andrew M. Olney, Irene-Angelica Chounta, Zitao Liu, Olga C. Santos, and Ig Ibert Bittencourt (Eds.). Springer Nature Switzerland, Cham, 134–149.
export class DistanceComparisonModel extends ComparatorModel {
  constructor(distance, orderedList) {
    super()
    this.distance = distance;
    this.orderedList = orderedList;
  }

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

// Exact match necessary, two-way agreement (i.e., an AI categorization not in regular set, means a zero).
// returns agreement percentage
export class EqualComparisonModel extends ComparatorModel {
  constructor() {
    super()
  }

  run(inputa, inputb){
    let seta = new Set(inputa)
    let setb = new Set(inputb)
    const int = inputa.filter(e => setb.has(e)).length
    const adis = inputa.filter(e => !(setb.has(e))).length
    const bdis = inputb.filter(e => !(seta.has(e))).length

    return int / (adis + bdis + int)
  }
}

export class Comparator {
  constructor(a, b) {
    if (!(a instanceof Response && b instanceof Response))
      throw new Error("Mismatch in comparison, requires two responses");
    if (a.rootInput() !== b.rootInput())
      throw new Error("Mismatch in comparison, not comparing same input");
    this.a = a;
    this.b = b;
  }

  // pairs all a's with b's, looses singular b's and a's
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

  run(model) {
    if (!(model instanceof ComparatorModel))
      throw new Error("Not providing comparator model");
    const inputa = Array.isArray(this.a.output) ? this.a.output : [this.a.output];
    const inputb = Array.isArray(this.b.output) ? this.b.output : [this.b.output];
    return model.run(inputa, inputb);
  }
}

const format = (content, role) => ({ role, content });

const fetch = async (content, context) => {
  const url = `${llm_config.path}:${llm_config.port}/${llm_config.endpoint}`;
  try {
    const response = await axios.post(
      url,
      {
        model: llm_config.model,
        messages: [format(content, "user"), ...context],
        temperature: llm_config.settings.temperature,
        max_tokens: llm_config.settings.max_tokens,
        stream: llm_config.settings.stream,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (e) {
    if (e.code === "ECONNREFUSED") {
      throw new Error("Connection refused, is LM Studio running?");
    }
    console.log(e);
    throw new Error(e);
  }
};

export class Caller {
  constructor(id) {

    if (existingCallers[id]) throw new Error(`Duplicate Caller entry (${id})`);
    this.id = id;
    existingCallers[id] = this;
  }

  
}

export class ProgrammaticCaller extends Caller {
  constructor(fun, id = hash(fun)) {
    super(id);
    this.fun = fun;
  }

  async run(content) {
    let input = content;
    if (content instanceof Response) {
      input = content.output;
    } else if (typeof content !== "string" && !(content instanceof String)) {
      if (typeof content === "promise")
        throw new Error("Unresolved future as input");
      throw new Error(`Illegal input type '${content}'`);
    }
    const result = await this.fun(input);
    if (result instanceof Response) return result;
    return new Response(result, this, content);
  }

  equals(obj) {
    return obj instanceof ProgrammaticCaller && this.id === obj.id;
  }
}

export class LLMCaller extends Caller {
  constructor(context, id = hash(context)) {
    super(id);
    if (!Array.isArray(context)) context = [context];
    this.context = context; // for retrieval
    this._context = context.map((c) => format(c, "system")); // for system
  }

  async run(content) {
    let input = content;
    if (content instanceof Response) {
      input = content.output;
    } else if (typeof content !== "string" && !(content instanceof String)) {
      throw new Error(`Illegal input type '${content}'`);
    }
    const output = await fetch(input, this._context);
    return new Response(output, this, content);
  }

  tokens() {
    let sum = 0;
    for (const item of this.context) sum += item.length;
    return sum;
  }

  equals(obj) {
    return obj instanceof LLMCaller && this.id === obj.id;
  }
}

export const setConfigFromFile = (file) =>
  (llm_config = loadFromFile(file, requiredSchema));

export const setConfigFromObject = (obj) => {
  validateObject(obj);
  llm_config = obj;
};

export const $ = (content, id = undefined) => {
  if (Array.isArray(content)) return new LLMCaller(content, id);
  if (typeof content === "function") return new ProgrammaticCaller(content, id);
};



export const exists = (content, id = undefined) =>
  existingCallers[id ? id : hash(content)] !== undefined;

export const get = (id) => existingCallers[id];
