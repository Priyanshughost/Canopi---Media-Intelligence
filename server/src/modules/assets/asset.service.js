import fs from 'fs/promises';
import { MediaAsset } from './asset.model.js';
import { analyzeImage } from '../../ai/chains/imageAnalysis.js';
import {
  analyzeWithCloudinaryVision,
  syncAssetMetadataToCloudinary,
} from '../../services/cloudinaryIntelligence.js';
import embeddings from '../../ai/embedding/embedding_model.js';
import { pineconeIndex } from '../../integrations/pinecone.js';
import { Project } from '../projects/project.model.js';

export const processAssetPipeline = async (assetId, filePath, mimeType) => {
  try {
    // 1. Fetch Asset and Project
    const asset = await MediaAsset.findById(assetId);
    if (!asset) throw new Error('Asset not found');
    const project = await Project.findById(asset.projectId);

    // 2. Dual Vision AI Analysis (Groq/Qwen + Cloudinary AI Vision)
    let aiAnalysis = {};
    let cloudinaryVisionAnalysis = null;

    if (asset.mediaType === 'image') {
      console.log(`[Pipeline] Dual AI analyzing image for asset ${assetId}`);
      asset.processingStatus = 'ANALYZING';
      await asset.save();

      const [groqRes, cloudVisionRes] = await Promise.allSettled([
        analyzeImage(asset.enhancedVersion || asset.cloudinary.secureUrl),
        analyzeWithCloudinaryVision(asset.cloudinary.publicId),
      ]);

      if (groqRes.status === 'fulfilled') {
        aiAnalysis = groqRes.value;
        aiAnalysis.analyzedAt = new Date();
        aiAnalysis.model = { provider: 'Groq/Qwen', model: 'qwen-27b' };
        asset.aiAnalysis = aiAnalysis;
      } else {
        console.error(`[Pipeline] Groq analysis failed for ${assetId}:`, groqRes.reason?.message);
      }

      if (cloudVisionRes.status === 'fulfilled') {
        cloudinaryVisionAnalysis = cloudVisionRes.value;
        asset.cloudinaryVisionAnalysis = cloudinaryVisionAnalysis;
      } else {
        console.error(
          `[Pipeline] Cloudinary Vision analysis failed for ${assetId}:`,
          cloudVisionRes.reason?.message
        );
      }

      await asset.save();
    } else {
      // For video, note frame extraction requirement
      aiAnalysis = {
        description: 'Video content. Requires frame extraction for full analysis.',
        tags: ['video'],
      };
      asset.aiAnalysis = aiAnalysis;
      await asset.save();
    }

    // 3. Generate Semantic Document enriched with both AI outputs
    console.log(`[Pipeline] Generating embeddings for asset ${assetId}`);
    asset.processingStatus = 'EMBEDDING';
    await asset.save();

    const cloudVisionAnswers = cloudinaryVisionAnalysis?.questions
      ? cloudinaryVisionAnalysis.questions.map((q) => `${q.question}: ${q.answer}`).join(' ')
      : '';

    const semanticDocument = `
      Project: ${project?.name || 'Unknown'}
      Description: ${aiAnalysis.description || ''}
      Activities: ${(aiAnalysis.activities || []).join(', ')}
      Objects: ${(aiAnalysis.objects || []).join(', ')}
      Tags: ${(aiAnalysis.tags || []).join(', ')}
      CloudinaryVision: ${cloudVisionAnswers}
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

    // 5. Done - Mark READY and sync structured metadata/tags back to Cloudinary
    console.log(`[Pipeline] Completed processing for asset ${assetId}`);
    asset.processingStatus = 'READY';
    await asset.save();

    // Sync tags and metadata to Cloudinary for system-of-record durability
    syncAssetMetadataToCloudinary(asset).catch((syncErr) =>
      console.warn(`[Pipeline] Background Cloudinary metadata sync warning:`, syncErr.message)
    );

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
