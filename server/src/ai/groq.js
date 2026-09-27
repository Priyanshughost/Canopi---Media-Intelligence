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

export const paraphraseProjectDescription = async (text, context = {}) => {
  if (!text || !text.trim()) {
    throw new Error('Description text is required for paraphrasing.');
  }

  const prompt = `You are an expert NGO project coordinator and bilingual communication specialist.
A field worker has provided a project description in their local language (such as Hindi, Hinglish, Bengali, Tamil, Telugu, Marathi, Spanish, Urdu, etc. or casual colloquial phrasing).

Your task:
1. Accurately understand the meaning, objectives, key actions, beneficiaries, and location mentioned in the local language input.
2. Paraphrase and translate it into a professional, fluent, high-impact English project description.
3. Make it well-structured, inspiring, and formal (suitable for impact reports, stakeholder reviews, and donor visibility).
4. Do not invent new unrelated facts; faithfully convey and refine all details provided.
5. Return ONLY the final polished English text. Do not include quotes, markdown headers, greetings, or intro/outro explanations.

Project Name Context: ${context.name || 'N/A'}
Organization Context: ${context.organization || 'N/A'}
Location Context: ${context.location || 'N/A'}

Local/Raw Description:
${text}`;

  console.log(`[AI Trigger] Starting Groq Paraphrasing for Description: "${text.substring(0, 50)}..."`);

  try {
    const result = await gpt120b.invoke(prompt);
    const content = typeof result.content === 'string' ? result.content.trim() : String(result.content || '').trim();
    console.log(`[AI Output] Groq Paraphrased Description:\n${content}`);
    return content;
  } catch (error) {
    console.error("Failed to paraphrase description with Groq gpt120b, trying fallback:", error);
    try {
      const { gpt20b } = await import("./models/gpt-20b.js");
      const fallbackResult = await gpt20b.invoke(prompt);
      const fallbackContent = typeof fallbackResult.content === 'string' ? fallbackResult.content.trim() : String(fallbackResult.content || '').trim();
      return fallbackContent;
    } catch (fallbackErr) {
      console.error("All AI paraphrase attempts failed:", fallbackErr);
      throw new Error("Failed to paraphrase description.");
    }
  }
};
