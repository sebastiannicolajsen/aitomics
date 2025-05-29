import { setConfigFromFile, setConfigFromObject, $ } from '../src/index.js'


const llmConfig = {
    model: "llama-3.2-3b-instruct",
    path: "http://127.0.0.1",
    port: 1234,
    endpoint: "v1/chat/completions",
    settings: {
      temperature: 0.7,
      max_tokens: -1,
      stream: false
    }
  };

setConfigFromObject(llmConfig);

const caller = $("Say hi back", "hello-world");
const result = await caller.run("hi!");
console.log(result)