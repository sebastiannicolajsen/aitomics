import hash from "hash-it"
import { IdentityCaller } from "./caller-identity.js";
import { ProgrammaticCaller } from "./caller-programmatic.js";
import { LLMCaller } from "./caller-llm.js";
import { existingCallers } from "./base.js"



const identityCaller = new IdentityCaller()

/**
 * Shortcut to generate Callers
 * @param {Function | Array | undefined} content - to determine type of caller, i.e., function yields Programmatic, Array yields LLM, undefined returns identity caller
 * @param {string | undefined} id - if no id is provided, a hash value will be used (of the input)
 * @returns Caller of given type
 */
export const $ = (content, id = undefined) => {
  if(content == undefined) return identityCaller;
  if (Array.isArray(content) || typeof(content) === "string") return new LLMCaller(content, id);
  if (typeof content === "function") return new ProgrammaticCaller(content, id);
};

/**
 * Returns true if the object provided (hashed) or the string provided exists as a caller
 * @param {Object | string} id 
 * @returns boolean
 */
export const exists = (id) =>
  existingCallers[typeof(id) === "string" ? id : hash(content)] !== undefined;

/**
 * Returns a Caller if the object provided (hashed) or the string provided exists as a caller
 * @param {Object | string} id 
 * @returns Caller
 */
export const get = (id) => existingCallers[typeof(id) === "string" ? id : hash(content)];