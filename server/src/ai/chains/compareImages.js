import { z } from "zod";
import { qwen27b } from "../models/qwen-27b.js";

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
  const modelWithStructuredOutput = qwen27b.withStructuredOutput(ComparisonSchema);

  const prompt = "You are an expert environmental impact analyst. Compare these two images (before and after) and extract structured observations about the changes according to the schema. Be objective and do not hallucinate scientific measurements.";

  console.log(`[AI Trigger] Starting Qwen Comparison for Before URL: ${beforeUrl} and After URL: ${afterUrl}`);

  try {
    const result = await modelWithStructuredOutput.invoke([
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: beforeUrl } },
          { type: "image_url", image_url: { url: afterUrl } }
        ]
      }
    ]);
    
    console.log('[AI Output] Comparison Response:');
    console.dir(result, { depth: null, colors: true });
    return result;
  } catch (error) {
    console.error("Gemini Comparison failed:", error);
    throw new Error("Failed to compare images with AI.");
  }
};
