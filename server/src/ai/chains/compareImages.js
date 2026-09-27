import { z } from "zod";
import { qwen27b } from "../models/qwen-27b.js";
import { gemini_3_8_flash } from "../models/gemini.js";

const ComparisonSchema = z.object({
  summary: z.string().describe("A concise summary of the visual differences between the before and after images."),
  observations: z.array(z.object({
    category: z.string(),
    before: z.string(),
    after: z.string(),
    change: z.string()
  })).describe("Detailed structured observations of changes."),
  limitations: z.array(z.string()).describe("A list of limitations, e.g. 'Visual comparison does not establish measured environmental impact.'")
});

export const compareImages = async (beforeUrl, afterUrl) => {
  const prompt = "You are an expert environmental impact analyst. Compare these two images (before and after) and extract structured observations about the changes according to the schema. Be objective and do not hallucinate scientific measurements.";

  // 1. Primary Attempt with Groq (Qwen-27b)
  try {
    console.log(`[AI Trigger] Starting Qwen Comparison for Before URL: ${beforeUrl} and After URL: ${afterUrl}`);
    const groqStructured = qwen27b.withStructuredOutput(ComparisonSchema);
    const result = await groqStructured.invoke([
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: beforeUrl } },
          { type: "image_url", image_url: { url: afterUrl } }
        ]
      }
    ]);
    console.log('[AI Output] Groq Comparison Response:');
    console.dir(result, { depth: null, colors: true });
    return result;
  } catch (groqError) {
    console.warn("[AI Comparison] Groq comparison failed or rate-limited, falling back to Gemini:", groqError.message);
  }

  // 2. Secondary Fallback with Gemini 2.5 Pro
  try {
    console.log(`[AI Trigger] Starting Gemini Fallback Comparison for Before URL: ${beforeUrl} and After URL: ${afterUrl}`);
    const geminiStructured = gemini_3_8_flash.withStructuredOutput(ComparisonSchema);
    const result = await geminiStructured.invoke([
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: beforeUrl } },
          { type: "image_url", image_url: { url: afterUrl } }
        ]
      }
    ]);
    console.log('[AI Output] Gemini Fallback Comparison Response:');
    console.dir(result, { depth: null, colors: true });
    return result;
  } catch (geminiError) {
    console.error("[AI Comparison] Gemini fallback comparison also failed:", geminiError.message);
    throw new Error("Failed to compare images with AI.");
  }
};
