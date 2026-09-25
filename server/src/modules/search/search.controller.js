import { pineconeIndex } from '../../integrations/pinecone.js';
import embeddings from '../../ai/embedding/embedding_model.js';
import { MediaAsset } from '../assets/asset.model.js';

export const semanticSearch = async (req, res, next) => {
  try {
    const { query, projectId, mediaType, limit = 10 } = req.body;
    
    console.log('[Search Controller] Semantic search requested', { query, projectId, mediaType, limit });

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Generate embedding for user query
    const queryEmbedding = await embeddings.embedQuery(query);
    

    if (!pineconeIndex) {
      return res.status(503).json({ error: 'Search service is currently unavailable' });
    }

    // Prepare metadata filters for Pinecone
    const filter = {};
    if (projectId) filter.projectId = projectId;
    if (mediaType) filter.mediaType = mediaType;

    // Perform vector search
    const searchResults = await pineconeIndex.query({
      vector: queryEmbedding,
      topK: parseInt(limit, 10),
      includeMetadata: true,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    });

    if (!searchResults.matches || searchResults.matches.length === 0) {
      return res.json([]);
    }

    // Extract asset IDs and map relevance scores
    const matchMap = new Map();
    const assetIds = searchResults.matches.map(match => {
      const assetId = match.metadata.assetId;
      matchMap.set(assetId, match.score);
      return assetId;
    });

    // Fetch full records from MongoDB to act as source of truth
    const assets = await MediaAsset.find({ _id: { $in: assetIds } });

    // Sort by Pinecone score and attach score to result
    const enrichedAssets = assets.map(asset => {
      const doc = asset.toObject();
      doc.relevanceScore = matchMap.get(doc._id.toString());
      return doc;
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);

    res.json(enrichedAssets);
  } catch (error) {
    next(error);
  }
};
