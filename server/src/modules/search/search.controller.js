import { pineconeIndex } from '../../integrations/pinecone.js';
import embeddings from '../../ai/embedding/embedding_model.js';
import { MediaAsset } from '../assets/asset.model.js';
import { Project } from '../projects/project.model.js';

export const semanticSearch = async (req, res, next) => {
  try {
    const { query, projectId, mediaType, limit = 10 } = req.body;
    
    console.log('[Search Controller] Semantic search requested', { query, projectId, mediaType, limit });

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    let orgProjectIds = null;
    if (req.user?.organizationId) {
      const orgProjects = await Project.find({ organizationId: req.user.organizationId }).select('_id');
      orgProjectIds = orgProjects.map((p) => p._id.toString());
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

    // Extract asset IDs and map relevance scores & video timestamp segments
    const matchMap = new Map();
    const segmentMap = new Map();
    const assetIds = [];

    searchResults.matches.forEach((match) => {
      const assetId = match.metadata?.assetId;
      if (!assetId) return;

      if (!assetIds.includes(assetId)) assetIds.push(assetId);

      const existingScore = matchMap.get(assetId) || 0;
      if (match.score > existingScore) {
        matchMap.set(assetId, match.score);
      }

      if (match.metadata.startTime !== undefined && match.metadata.endTime !== undefined) {
        if (!segmentMap.has(assetId)) {
          segmentMap.set(assetId, {
            start: match.metadata.startTime,
            end: match.metadata.endTime,
            text: match.metadata.text,
            frameUrl: match.metadata.frameUrl,
            score: match.score,
          });
        }
      }
    });

    // Fetch full records from MongoDB scoped to user's organization projects
    const mongoFilter = { _id: { $in: assetIds } };
    if (orgProjectIds) {
      mongoFilter.projectId = { $in: orgProjectIds };
    }
    const assets = await MediaAsset.find(mongoFilter);

    // Sort by Pinecone score and attach score & matched timestamp to result
    const enrichedAssets = assets
      .map((asset) => {
        const doc = asset.toObject();
        doc.relevanceScore = matchMap.get(doc._id.toString());
        if (segmentMap.has(doc._id.toString())) {
          const seg = segmentMap.get(doc._id.toString());
          doc.matchedTimestamp = { start: seg.start, end: seg.end };
          doc.matchedSnippet = seg.text;
          doc.matchedFrameUrl = seg.frameUrl;
        }
        return doc;
      })
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    res.json(enrichedAssets);
  } catch (error) {
    next(error);
  }
};
