import { vectorStore } from "../../integrations/pinecone.js";

export const performSemanticSearch = async (query, filters = {}, limit = 10) => {
  try {
    // We can use the vectorStore as a retriever or call similaritySearch directly
    // Since PineconeStore wraps it beautifully, we just call similaritySearch
    const results = await vectorStore.similaritySearch(query, limit, filters);
    
    // results will be an array of Document objects 
    // e.g. [{ pageContent: "...", metadata: { assetId: "...", projectId: "..." } }]
    return results;
  } catch (error) {
    console.error("Semantic Search failed:", error);
    throw new Error("Failed to perform semantic search.");
  }
};
