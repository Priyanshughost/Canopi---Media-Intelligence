import { z } from "zod";
import { gpt120b } from "./models/gpt-120b.js";
import { gemini_3_8_flash } from "./models/gemini.js";

const ReportSchema = z.object({
  title: z.string(),
  executiveSummary: z.string(),
  keyFindings: z.array(z.string()),
  limitations: z.string()
});

export const generateProjectReport = async (project, evidenceData) => {
  // 1. Compact payload to essential fields to prevent token limit exceed / 413 errors
  const compactProject = {
    title: project?.title || project?.name || 'Environmental Impact Initiative',
    description: project?.description || '',
    location: project?.location || '',
    category: project?.category || '',
  };

  const compactEvidence = (Array.isArray(evidenceData) ? evidenceData : [evidenceData]).map((e) => ({
    title: e.title,
    type: e.type,
    description: e.description,
    observations: e.observations?.map((o) =>
      typeof o === 'string' ? o : `${o.category || 'Observation'}: ${o.change || o.text || ''}`
    ),
    keyVisualFindings: e.sourceAssets
      ?.flatMap((a) => a.aiAnalysis?.visualSignals || [a.aiAnalysis?.description])
      .filter(Boolean)
      .slice(0, 4),
  }));

  const prompt = `You are a professional impact analyst. Generate a structured report based on the following project data and evidence. Make sure to adhere strictly to the "OBSERVATION != PROOF" rule.

Project: ${JSON.stringify(compactProject)}
Evidence: ${JSON.stringify(compactEvidence)}`;

  console.log(`[AI Trigger] Starting Groq Report Generation for Project: ${compactProject.title}`);

  // 1. Try Groq (gpt-120b)
  try {
    const modelWithStructuredOutput = gpt120b.withStructuredOutput(ReportSchema);
    const result = await modelWithStructuredOutput.invoke(prompt);
    console.log('[AI Output] Groq Report Generation Response:');
    console.dir(result, { depth: null, colors: true });
    return result;
  } catch (groqError) {
    console.warn('[AI Report] Groq report generation rate-limited or failed, falling back to Gemini:', groqError.message);
  }

  // 2. Fallback to Gemini 2.5 Pro
  try {
    console.log(`[AI Trigger] Starting Gemini Fallback Report Generation for Project: ${compactProject.title}`);
    const geminiStructured = gemini_3_8_flash.withStructuredOutput(ReportSchema);
    const result = await geminiStructured.invoke(prompt);
    console.log('[AI Output] Gemini Report Generation Response:');
    console.dir(result, { depth: null, colors: true });
    return result;
  } catch (geminiError) {
    console.error('[AI Report] Gemini fallback report generation failed:', geminiError.message);
    throw new Error('Report generation failed with both Groq and Gemini AI.');
  }
};

export const generateCampaignContent = async (project, evidence) => {
  const compactProject = {
    title: project?.title || project?.name || 'Environmental Impact Initiative',
    description: project?.description || '',
    location: project?.location || '',
  };

  const compactEvidence = {
    title: evidence?.title,
    description: evidence?.description,
    observations: evidence?.observations?.map((o) =>
      typeof o === 'string' ? o : `${o.category || 'Obs'}: ${o.change || o.text || ''}`
    ),
  };

  const prompt = `You are a social media campaign manager. Generate inspiring campaign copy for the following project and evidence.

Project: ${JSON.stringify(compactProject)}
Evidence: ${JSON.stringify(compactEvidence)}

Output just the campaign content text with engaging hashtags.`;

  console.log(`[AI Trigger] Starting Campaign Generation for Project: ${compactProject.title}`);

  // 1. Try Groq
  try {
    const result = await gpt120b.invoke(prompt);
    console.log(`[AI Output] Groq Campaign Generation Response:\n${result.content}`);
    return result.content;
  } catch (groqError) {
    console.warn('[AI Campaign] Groq campaign generation failed, falling back to Gemini:', groqError.message);
  }

  // 2. Fallback to Gemini
  try {
    const result = await gemini_3_8_flash.invoke(prompt);
    console.log(`[AI Output] Gemini Campaign Generation Response:\n${result.content}`);
    return result.content;
  } catch (geminiError) {
    console.error('[AI Campaign] Gemini campaign generation failed:', geminiError.message);
    throw new Error('Campaign generation failed.');
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
