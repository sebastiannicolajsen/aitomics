import axios from 'axios';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadFromFile, validateObject } from "../index.js";

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




const __dirname = dirname(fileURLToPath(import.meta.url));

let llm_config = loadFromFile(__dirname + "/" + CONFIG_FILE, requiredSchema);

const format = (content, role) => ({ role, content });

/**
 * Sets the config file used for fetching (requires elements defined in the default-config.yml file)
 * @param {string} file 
 */
export const setConfigFromFile = (file) =>
  (llm_config = loadFromFile(file, requiredSchema));

/**
 * Sets the configuration used for fetching (requires elements described in default-config.yml file)
 * @param {Object} obj 
 */
export const setConfigFromObject = (obj) => {
  validateObject(obj);
  llm_config = obj;
};

/**
 * Fetch response from LLM as described by the default-config.yml, or as overriden by using setConfigFromFile / setConfigFromObject
 * @param {string} content - input to be used as user message 
 * @param {*} context - input used as system messages (must have role described, e.g., system)
 * @returns 
 */
export const fetch = async (content, context) => {
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