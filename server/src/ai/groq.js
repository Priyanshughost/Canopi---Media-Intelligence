import { z } from "zod";
import { gpt120b } from "./models/gpt-120b.js";

const ReportSchema = z.object({
  title: z.string(),
  executiveSummary: z.string(),
  keyFindings: z.array(z.string()),
  limitations: z.string()
});

export const generateProjectReport = async (project, evidenceData) => {
  const modelWithStructuredOutput = gpt120b.withStructuredOutput(ReportSchema);
  
  const prompt = `You are a professional impact analyst. Generate a structured report based on the following project data and evidence. Make sure to adhere strictly to the "OBSERVATION != PROOF" rule.

Project: ${JSON.stringify(project)}
Evidence: ${JSON.stringify(evidenceData)}`;

  console.log(`[AI Trigger] Starting Groq Report Generation for Project: ${project.name}`);

  try {
    const result = await modelWithStructuredOutput.invoke(prompt);
    
    console.log('[AI Output] Groq Report Generation Response:');
    console.dir(result, { depth: null, colors: true });
    return result;
  } catch (error) {
    console.error("Failed to generate project report:", error);
    throw new Error("Report generation failed.");
  }
};

export const generateCampaignContent = async (project, evidence) => {
  const prompt = `You are a social media campaign manager. Generate campaign content for the following project and evidence.

Project: ${JSON.stringify(project)}
Evidence: ${JSON.stringify(evidence)}

Output just the campaign content text.`;

  console.log(`[AI Trigger] Starting Groq Campaign Generation for Project: ${project.name}`);

  try {
    const result = await gpt120b.invoke(prompt);
    
    console.log(`[AI Output] Groq Campaign Generation Response:\n${result.content}`);
    return result.content;
  } catch (error) {
    console.error("Failed to generate campaign content:", error);
    throw new Error("Campaign generation failed.");
  }
};
