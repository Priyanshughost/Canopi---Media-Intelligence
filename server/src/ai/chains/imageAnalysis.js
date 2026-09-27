import { z } from "zod";
import { qwen27b } from "../models/qwen-27b.js";
import { gemini_3_8_flash } from "../models/gemini.js";

// Define the structured output schema we expect from AI vision models
const ImageAnalysisSchema = z.object({
  description: z.string().describe("A concise but detailed description of what is happening in the image."),
  activities: z.array(z.string()).describe("A list of relevant activities visible in the image (e.g., 'waste collection', 'tree planting')."),
  objects: z.array(z.string()).describe("A list of key physical objects visible (e.g., 'people', 'river', 'plastic waste')."),
  tags: z.array(z.string()).describe("Relevant thematic tags for semantic search (e.g., 'environment', 'cleanup')."),
  visualSignals: z.array(z.string()).describe("Observable signals or evidence of impact (e.g., 'group participation', 'cleared land').")
});

export const analyzeImage = async (imageUrl) => {
  const prompt = "You are an expert environmental and impact analyst. Analyze this field evidence image and extract structured insights according to the schema. Be objective and do not hallucinate scientific measurements that cannot be seen visually.";

  // 1. Primary Attempt with Groq (Qwen-27b)
  try {
    console.log(`[AI Trigger] Starting Groq Image Analysis for URL: ${imageUrl}`);
    const groqStructured = qwen27b.withStructuredOutput(ImageAnalysisSchema);
    const result = await groqStructured.invoke([
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }
    ]);
    console.log('[AI Output] Groq Image Analysis Response:');
    console.dir(result, { depth: null, colors: true });
    return result;
  } catch (groqError) {
    console.warn("[AI Vision] Groq analysis rate-limited or failed, falling back to Gemini:", groqError.message);
  }

  // 2. Secondary Fallback with Gemini 2.5 Pro
  try {
    console.log(`[AI Trigger] Starting Gemini Fallback Image Analysis for URL: ${imageUrl}`);
    const geminiStructured = gemini_3_8_flash.withStructuredOutput(ImageAnalysisSchema);
    const result = await geminiStructured.invoke([
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }
    ]);
    console.log('[AI Output] Gemini Fallback Image Analysis Response:');
    console.dir(result, { depth: null, colors: true });
    return result;
  } catch (geminiError) {
    console.error("[AI Vision] Gemini fallback also failed:", geminiError.message);
    throw new Error("Failed to analyze image with both Groq and Gemini AI.");
  }
};
