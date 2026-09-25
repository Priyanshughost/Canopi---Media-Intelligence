import { z } from "zod";
import { qwen27b } from "../models/qwen-27b.js";

// Define the structured output schema we expect from Gemini
const ImageAnalysisSchema = z.object({
  description: z.string().describe("A concise but detailed description of what is happening in the image."),
  activities: z.array(z.string()).describe("A list of relevant activities visible in the image (e.g., 'waste collection', 'tree planting')."),
  objects: z.array(z.string()).describe("A list of key physical objects visible (e.g., 'people', 'river', 'plastic waste')."),
  tags: z.array(z.string()).describe("Relevant thematic tags for semantic search (e.g., 'environment', 'cleanup')."),
  visualSignals: z.array(z.string()).describe("Observable signals or evidence of impact (e.g., 'group participation', 'cleared land').")
});

export const analyzeImage = async (imageUrl) => {
  // Bind the Zod schema to force structured JSON output
  const modelWithStructuredOutput = qwen27b.withStructuredOutput(ImageAnalysisSchema);

  const prompt = "You are an expert environmental and impact analyst. Analyze this field evidence image and extract structured insights according to the schema. Be objective and do not hallucinate scientific measurements that cannot be seen visually.";

  console.log(`[AI Trigger] Starting Gemini Image Analysis for URL: ${imageUrl}`);

  try {
    const result = await modelWithStructuredOutput.invoke([
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }
    ]);

    console.log('[AI Output] Image Analysis Response:');
    console.dir(result, { depth: null, colors: true });
    return result;
  } catch (error) {
    console.error("Gemini Analysis failed:", error);
    throw new Error("Failed to analyze image with AI.");
  }
};
