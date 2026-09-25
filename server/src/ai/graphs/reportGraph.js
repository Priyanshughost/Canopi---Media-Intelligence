import { StateGraph, END, START } from "@langchain/langgraph";
import { gpt120b } from "../models/gpt-120b.js";
import { gptsafeguard20b } from "../models/gpt-safeguard-20b.js";
import { z } from "zod";

// Define the state schema for our Graph
const graphState = {
  projectData: {
    value: (x, y) => y ? y : x,
    default: () => ""
  },
  evidence: {
    value: (x, y) => y ? y : x,
    default: () => []
  },
  draftReport: {
    value: (x, y) => y ? y : x,
    default: () => ""
  },
  validationErrors: {
    value: (x, y) => y ? y : x,
    default: () => []
  },
  finalReport: {
    value: (x, y) => y ? y : x,
    default: () => ""
  },
  iterationCount: {
    value: (x, y) => x + y,
    default: () => 0
  }
};

// Node 1: Draft the report using the heavy reasoning model
const draftNode = async (state) => {
  const prompt = `You are a professional impact analyst for NGOs. Draft a comprehensive impact report based on the following project data and verified visual evidence.
  
Project Data:
${state.projectData}

Evidence:
${JSON.stringify(state.evidence)}

Draft a detailed narrative report. Make sure to clearly state that findings are based on visual observations. Do NOT invent or hallucinate scientific measurements (e.g., exact CO2 reduction, water purity percentages) unless explicitly provided in the data.`;

  const response = await gpt120b.invoke(prompt);
  
  return { 
    draftReport: response.content,
    iterationCount: 1 
  };
};

// Node 2: Validate the report using the safeguard model
const validateNode = async (state) => {
  const validationSchema = z.object({
    isValid: z.boolean().describe("True if the report relies solely on visual evidence and does not hallucinate scientific metrics."),
    errors: z.array(z.string()).describe("List of hallucinated claims or scientific metrics that are unsupported by visual evidence.")
  });
  
  const validator = gptsafeguard20b.withStructuredOutput(validationSchema);
  
  const prompt = `Review the following draft impact report. Your job is to enforce the rule: "OBSERVATION != PROOF". 
If the report invents scientific metrics (e.g., "water purity improved by 40%") based merely on photos of cleanups, reject it. If it correctly states "visible surface waste was reduced based on photos", accept it.

Draft Report:
${state.draftReport}`;

  const validationResult = await validator.invoke(prompt);
  
  return {
    validationErrors: validationResult.errors || []
  };
};

// Conditional Edge Logic
const shouldRewrite = (state) => {
  if (state.validationErrors.length > 0 && state.iterationCount < 3) {
    return "rewrite";
  }
  return "finalize";
};

// Node 3: Rewrite if validation failed
const rewriteNode = async (state) => {
  const prompt = `Rewrite the following report to fix these specific hallucinated claims. You must remove or correct them to only reflect visual observations.
  
Errors to fix:
${state.validationErrors.join('\n')}

Original Draft:
${state.draftReport}`;

  const response = await gpt120b.invoke(prompt);
  return {
    draftReport: response.content,
    validationErrors: [],
    iterationCount: 1
  };
};

// Node 4: Finalize
const finalizeNode = async (state) => {
  return { finalReport: state.draftReport };
};

// Construct the Graph
const workflow = new StateGraph({ channels: graphState })
  .addNode("draft", draftNode)
  .addNode("validate", validateNode)
  .addNode("rewrite", rewriteNode)
  .addNode("finalize", finalizeNode)
  
  .addEdge(START, "draft")
  .addEdge("draft", "validate")
  .addConditionalEdges("validate", shouldRewrite, {
    rewrite: "rewrite",
    finalize: "finalize"
  })
  .addEdge("rewrite", "validate") // Loop back to validate after rewriting
  .addEdge("finalize", END);

export const reportGeneratorGraph = workflow.compile();
