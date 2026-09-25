import fs from 'fs/promises';
import { MediaAsset } from './asset.model.js';
import { analyzeImage } from '../../ai/chains/imageAnalysis.js';
import embeddings from '../../ai/embedding/embedding_model.js';
import { pineconeIndex } from '../../integrations/pinecone.js';
import { Project } from '../projects/project.model.js';

export const processAssetPipeline = async (assetId, filePath, mimeType) => {
  try {
    // 1. Fetch Asset and Project
    const asset = await MediaAsset.findById(assetId);
    if (!asset) throw new Error('Asset not found');
    const project = await Project.findById(asset.projectId);

    // 2. Analyze with Gemini (Image only for MVP)
    let aiAnalysis = {};
    if (asset.mediaType === 'image') {
      console.log(`[Pipeline] Analyzing image for asset ${assetId}`);
      asset.processingStatus = 'ANALYZING';
      await asset.save();
      
      // Cloudinary upload completed before this pipeline started, use the public secure URL
      aiAnalysis = await analyzeImage(asset.cloudinary.secureUrl);
      
      aiAnalysis.analyzedAt = new Date();
      aiAnalysis.model = { provider: 'Google', model: 'gemini-1.5-flash' };
      asset.aiAnalysis = aiAnalysis;
      await asset.save();
    } else {
      // For video, we skip frame extraction in this basic MVP phase 
      // but acknowledge it needs processing
      aiAnalysis = {
        description: 'Video content. Requires frame extraction for full analysis.',
        tags: ['video']
      };
      asset.aiAnalysis = aiAnalysis;
    }

    // 3. Generate Semantic Document
    console.log(`[Pipeline] Generating embeddings for asset ${assetId}`);
    asset.processingStatus = 'EMBEDDING';
    await asset.save();

    const semanticDocument = `
      Project: ${project?.name || 'Unknown'}
      Description: ${aiAnalysis.description || ''}
      Activities: ${(aiAnalysis.activities || []).join(', ')}
      Objects: ${(aiAnalysis.objects || []).join(', ')}
      Tags: ${(aiAnalysis.tags || []).join(', ')}
      Media Type: ${asset.mediaType}
    `.trim().replace(/\s+/g, ' '); // Normalize spaces

    const embedding = await embeddings.embedQuery(semanticDocument);

    // 4. Index in Pinecone
    console.log(`[Pipeline] Indexing to Pinecone for asset ${assetId}`);
    asset.processingStatus = 'INDEXING';
    await asset.save();


    if (pineconeIndex) {
      await pineconeIndex.upsert([{
        id: `asset:${asset._id.toString()}`,
        values: embedding,
        metadata: {
          assetId: asset._id.toString(),
          projectId: asset.projectId.toString(),
          mediaType: asset.mediaType,
          text: semanticDocument,
          // Extract tags for metadata filtering
          tags: aiAnalysis.tags || []
        }
      }]);
    } else {
      console.warn('[Pipeline] Skipping Pinecone index: Pinecone client not configured.');
    }

    // 5. Done
    console.log(`[Pipeline] Completed processing for asset ${assetId}`);
    asset.processingStatus = 'READY';
    await asset.save();
    
    // Clean up temp file
    try {
      await fs.unlink(filePath);
    } catch (err) {
      // Ignore if already deleted
    }

  } catch (error) {
    console.error(`[Pipeline] Error processing asset ${assetId}:`, error);
    try {
      await MediaAsset.findByIdAndUpdate(assetId, { processingStatus: 'FAILED' });
    } catch (updateErr) {
      console.error(`[Pipeline] Failed to update status to FAILED:`, updateErr);
    }
  }
};
