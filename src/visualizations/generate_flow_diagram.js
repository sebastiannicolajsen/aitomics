import { Response } from "../response/index.js";
import { ComparatorModel } from "../comparators/models/index.js";
import mermaid from 'mermaid';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

/**
 * Generates a Mermaid flow diagram with explicit fork/join points, labeled swimlanes,
 * and optional example data on arrows.
 *
 * This visualization was vibecoded, ensuring a smooth and intuitive representation of the data flow.
 *
 * @param {Array<Array<Response>>} responses - Array of response arrays, each representing a different flow path.
 * @param {Object} [config={}] - Configuration options.
 * @param {Array<string>} [config.labels] - Labels for each flow path in the same order as the responses array.
 * @param {boolean} [config.showExampleData=false] - If true, show example data flowing into nodes on arrows.
 * @param {number} [config.initialInputIndex=0] - Index of the response to use for initial input data.
 * @returns {Promise<{markdown: string, diagram: string}>} Object containing the Mermaid markdown and generated diagram.
 */
export async function generateFlowDiagram(responses, config = {}) {
  // Initialize mermaid
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    flowchart: {
      rankSpacing: 80
    }
  });

  // --- Configuration and Validation ---
  const {
    labels = [],
    showExampleData = false,
    initialInputIndex = 0
  } = config;

  if (!Array.isArray(responses)) {
    throw new Error("First argument must be an array of response arrays");
  }
  if (responses.length === 0) {
    throw new Error("At least one response array must be provided");
  }
  responses.forEach((responseArray, i) => {
    if (!Array.isArray(responseArray)) {
      throw new Error(`Response array at index ${i} must be an array`);
    }
  });
  if (initialInputIndex < 0 || initialInputIndex >= responses[0].length) {
    throw new Error(`Initial input index ${initialInputIndex} is out of bounds for first response array of length ${responses[0].length}`);
  }

  // Generate default labels for any missing ones
  const flowLabels = responses.map((_, i) => labels[i] || `Flow ${i + 1}`);

  // --- Data Structures ---
  const nodeDefinitions = new Map();
  const edges = responses.map(() => new Set());
  const edgesSpecial = new Set();
  const allCallerLabels = new Set();
  const callersInFlow = responses.map(() => new Set());
  const firstCallers = responses.map(() => new Set());
  const lastCallers = responses.map(() => new Set());
  const initialInputs = new Map(); // Map: firstCallerId -> initialInputData
  const finalOutputs = new Map(); // Map: callerId -> finalOutputData (overwritten during recursion)
  const exampleOutputs = responses.map(() => new Map()); // Map: callerId -> outputData from initialInputIndex response

  // --- Helper Functions ---
  const getNodeIdAndLabel = (caller) => {
    const baseLabel = caller.name || caller.id || `Caller_${Math.random().toString(36).substring(2, 7)}`;
    allCallerLabels.add(baseLabel.replace(/-/g, ' '));
    let displayLabel = baseLabel.replace(/-/g, ' ');
    const safeId = baseLabel.replace(/[^a-zA-Z0-9_]/g, '_');
    const maxLineLength = 25;
    if (displayLabel.length > maxLineLength) {
        let processedLabel = '';
        let currentLine = '';
        const words = displayLabel.split(' ');
        for (const word of words) {
            if (currentLine.length === 0) currentLine = word;
            else if (currentLine.length + word.length + 1 <= maxLineLength) currentLine += ' ' + word;
            else {
                processedLabel += (processedLabel.length > 0 ? '\n' : '') + currentLine;
                currentLine = word;
            }
        }
        processedLabel += (processedLabel.length > 0 ? '\n' : '') + currentLine;
        displayLabel = processedLabel;
    }
    return { id: safeId, label: displayLabel };
  };

  // Helper to format data for arrow labels
  const formatArrowLabel = (data) => {
    let text = JSON.stringify(data);
    if (text === undefined) text = 'undefined';
    
    if (typeof data === 'string' && text.startsWith('"') && text.endsWith('"')) {
         text = text.substring(1, text.length - 1);
    }
    text = text.replace(/"/g, '#quot;');

    // Add the prefix with a line break
    return `Example:<br>${text}`; 
  };

  // --- Build Graph Structure ---
  // First, process the initialInputIndex response to get example outputs
  if (showExampleData && responses.length > 0) {
    const processExampleOutputs = (response, flowIndex) => {
      if (!response || typeof response === 'string' || !(response instanceof Response)) return;
      if (!response.caller) return;
      
      const { id: callerNodeId } = getNodeIdAndLabel(response.caller);
      if (response.output !== undefined && response.output !== null) {
        exampleOutputs[flowIndex].set(callerNodeId, response.output);
      }
      
      if (response.input instanceof Response) {
        processExampleOutputs(response.input, flowIndex);
      }
    };
    
    responses.forEach((responseArray, i) => {
      if (responseArray.length > 0) {
        processExampleOutputs(responseArray[initialInputIndex], i);
      }
    });
  }

  // Recursive function to process a response chain
  const processResponseChain = (response, flowIndex) => {
    if (!response || typeof response === 'string' || !(response instanceof Response)) return;
    if (!response.caller) {
      console.warn(`Response object missing caller in flow ${flowIndex}:`, response);
      return;
    }
    const { id: callerNodeId, label: callerLabel } = getNodeIdAndLabel(response.caller);
    if (!nodeDefinitions.has(callerNodeId)) {
      nodeDefinitions.set(callerNodeId, `    ${callerNodeId}("${callerLabel}"); style ${callerNodeId} fill:#fff`);
    }
    callersInFlow[flowIndex].add(callerNodeId);
    
    // Store final output (will be overwritten by later steps if not the last)
    if (response.output !== undefined && response.output !== null) {
      finalOutputs.set(callerNodeId, response.output);
    }

    const input = response.input;
    if (input instanceof Response) {
      if (input.caller) {
        const { id: prevCallerNodeId } = getNodeIdAndLabel(input.caller);
        let edgeLabel = '';
        // Label is the output of the *current* step from exampleOutputs
        if (showExampleData) {
             const exampleOutput = exampleOutputs[flowIndex].get(callerNodeId);
             if (exampleOutput !== undefined && exampleOutput !== null) {
                edgeLabel = formatArrowLabel(exampleOutput);
             }
        }
        // Check if the connection already exists (without considering the label)
        const connectionExists = Array.from(edges[flowIndex]).some(edge => 
          edge.includes(`${prevCallerNodeId} --> ${callerNodeId}`) || 
          edge.includes(`${prevCallerNodeId} --`)
        );
        
        if (!connectionExists) {
          const edge = `    ${prevCallerNodeId} --${edgeLabel}--> ${callerNodeId};`;
          edges[flowIndex].add(edge);
        }
        processResponseChain(input, flowIndex);
      } else {
        console.warn(`Input Response object missing caller in flow ${flowIndex}:`, input);
        firstCallers[flowIndex].add(callerNodeId);
         // Cannot determine initial input if input response is broken
      }
    } else if (typeof input === 'string') {
      // Start of chain
      firstCallers[flowIndex].add(callerNodeId);
      initialInputs.set(callerNodeId, input); // Store initial data
    } else {
      console.warn(`Unexpected input type in flow ${flowIndex}:`, input);
    }
  };

  // Process each flow
  responses.forEach((responseArray, i) => {
    responseArray.forEach(response => {
      if (!(response instanceof Response)) throw new Error(`Flow ${i} list contains non-response type`);
      processResponseChain(response, i);
      if (response.caller) {
        const { id: lastCallerId } = getNodeIdAndLabel(response.caller);
        lastCallers[i].add(lastCallerId);
      }
    });
  });

  // --- Define Special Nodes and Edges ---
  const dataNodeId = "DATA_NODE";
  const forkNodeId = "ForkNode";
  let joinNodeId = null;

  nodeDefinitions.set(dataNodeId, `    ${dataNodeId}(("DATA"));`);
  nodeDefinitions.set(forkNodeId, `    ${forkNodeId}((" ")); style ${forkNodeId} fill:#000,stroke:#000,color:#fff`);
  
  // Add edge from DATA to Fork with initial input label if available
  let dataToForkLabel = '';
  if (showExampleData && responses[0].length > 0) {
    // Find the root input value by traversing the response chain
    let currentResponse = responses[0][initialInputIndex];
    while (currentResponse && currentResponse.input instanceof Response) {
      currentResponse = currentResponse.input;
    }
    if (currentResponse && typeof currentResponse.input === 'string') {
      dataToForkLabel = formatArrowLabel(currentResponse.input);
    }
  }
  edgesSpecial.add(`    ${dataNodeId} --${dataToForkLabel}--> ${forkNodeId};`);

  // Add edges from Fork to first callers without labels
  firstCallers.forEach(callerIds => {
    callerIds.forEach(callerId => {
      edgesSpecial.add(`    ${forkNodeId} --> ${callerId};`);
    });
  });

  if (lastCallers.some(callers => callers.size > 0)) {
    joinNodeId = "JoinNode";
    nodeDefinitions.set(joinNodeId, `    ${joinNodeId}((" ")); style ${joinNodeId} fill:#000,stroke:#000,color:#fff`);

    // Add edges from last callers to Join node with final output labels
    lastCallers.forEach((callerIds, i) => {
      callerIds.forEach(callerId => {
        let edgeLabel = '';
        if (showExampleData) {
          const exampleOutput = exampleOutputs[i].get(callerId);
          if (exampleOutput !== undefined && exampleOutput !== null && exampleOutput !== '') {
            edgeLabel = formatArrowLabel(exampleOutput);
          }
        }
        edgesSpecial.add(`    ${callerId} --${edgeLabel}--> ${joinNodeId};`);
      });
    });
  }

  // --- Assemble Final Diagram with Subgraphs ---
  let mermaidDiagram = "%%{init: {'flowchart': {'rankSpacing': 80}}}%%\n"; 
  mermaidDiagram += "graph TD;\n\n";
  mermaidDiagram += nodeDefinitions.get(dataNodeId) + "\n";
  mermaidDiagram += nodeDefinitions.get(forkNodeId) + "\n";
  if (joinNodeId) mermaidDiagram += nodeDefinitions.get(joinNodeId) + "\n";
  mermaidDiagram += "\n";
  
  // Add subgraphs for each flow
  responses.forEach((_, i) => {
    mermaidDiagram += `subgraph "${flowLabels[i]}"\n`;
    callersInFlow[i].forEach(nodeId => {
      if (nodeDefinitions.has(nodeId)) {
        mermaidDiagram += nodeDefinitions.get(nodeId) + "\n";
      }
    });
    mermaidDiagram += [...edges[i]].join("\n") + "\n";
    mermaidDiagram += "end\n\n";
  });

  mermaidDiagram += [...edgesSpecial].join("\n") + "\n";

  // Create a temporary file for the mermaid diagram
  const tempDir = os.tmpdir();
  const tempFile = path.join(tempDir, `flow-diagram-${Date.now()}.mmd`);
  fs.writeFileSync(tempFile, mermaidDiagram);

  try {
    // Use mmdc to generate the SVG
    const { stdout } = await execAsync(`npx mmdc -i ${tempFile} -o ${tempFile}.svg`);
    const diagram = fs.readFileSync(`${tempFile}.svg`, 'utf8');
    
    // Clean up temporary files
    fs.unlinkSync(tempFile);
    fs.unlinkSync(`${tempFile}.svg`);

    return {
      markdown: mermaidDiagram,
      diagram
    };
  } catch (error) {
    // Clean up temporary file in case of error
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    throw error;
  }
}