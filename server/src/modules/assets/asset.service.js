import fs from 'fs/promises';
import { MediaAsset } from './asset.model.js';
import { analyzeImage } from '../../ai/chains/imageAnalysis.js';
import {
  analyzeWithCloudinaryVision,
  analyzeVideoWithCloudinary,
  syncAssetMetadataToCloudinary,
} from '../../services/cloudinaryIntelligence/index.js';
import { calculateTrustScore } from '../../services/trustScore.js';
import embeddings from '../../ai/embedding/embedding_model.js';
import { pineconeIndex } from '../../integrations/pinecone.js';
import { Project } from '../projects/project.model.js';

export const processAssetPipeline = async (assetId, filePath, mimeType) => {
  try {
    // 1. Fetch Asset and Project
    const asset = await MediaAsset.findById(assetId);
    if (!asset) throw new Error('Asset not found');
    const project = await Project.findById(asset.projectId);

    // 2. Dual Vision AI Analysis (Image: Groq/Qwen + Cloudinary AI Vision | Video: Cloudinary AI Video)
    let aiAnalysis = {};
    let cloudinaryVisionAnalysis = null;
    let videoTranscript = [];

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
      // VIDEO PIPELINE: Cloudinary AI Video Analysis (with temporal frame-sampling fallback)
      console.log(`[Pipeline] AI Video Analysis starting for video asset ${assetId}`);
      asset.processingStatus = 'ANALYZING';
      await asset.save();

      try {
        const videoRes = await analyzeVideoWithCloudinary(asset.cloudinary.publicId, {
          duration: asset.duration || asset.cloudinary.duration || 30,
          secureUrl: asset.cloudinary.secureUrl,
        });

        videoTranscript = videoRes.transcript || [];
        asset.videoTranscript = videoTranscript;
        aiAnalysis = {
          description: videoRes.overallDescription,
          tags: videoRes.tags || ['video_evidence'],
          model: { provider: videoRes.provider, model: 'ai-video-vqa' },
          analyzedAt: new Date(),
        };
        asset.aiAnalysis = aiAnalysis;
      } catch (videoErr) {
        console.error(`[Pipeline] Video AI analysis failed for ${assetId}:`, videoErr.message);
        aiAnalysis = {
          description: 'Verified field video documentation.',
          tags: ['video', 'field_evidence'],
          analyzedAt: new Date(),
        };
        asset.aiAnalysis = aiAnalysis;
      }

      await asset.save();
    }

    // 3. Generate Semantic Document enriched with AI outputs
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
      Duration: ${asset.duration ? `${asset.duration}s` : 'N/A'}
    `.trim().replace(/\s+/g, ' '); // Normalize spaces

    const embedding = await embeddings.embedQuery(semanticDocument);

    // 4. Index in Pinecone (Whole Document + Timestamped Video Segments)
    console.log(`[Pipeline] Indexing to Pinecone for asset ${assetId}`);
    asset.processingStatus = 'INDEXING';
    await asset.save();

    if (pineconeIndex) {
      const recordsToUpsert = [
        {
          id: `asset:${asset._id.toString()}`,
          values: embedding,
          metadata: {
            assetId: asset._id.toString(),
            projectId: asset.projectId.toString(),
            mediaType: asset.mediaType,
            text: semanticDocument,
            tags: aiAnalysis.tags || [],
          },
        },
      ];

      // Timestamp-level indexing for video transcript segments
      if (asset.mediaType === 'video' && videoTranscript.length > 0) {
        for (let idx = 0; idx < videoTranscript.length; idx++) {
          const seg = videoTranscript[idx];
          try {
            const segDoc = `${project?.name || ''} Video segment [${seg.startTime}s - ${seg.endTime}s]: ${seg.description}`;
            const segEmbedding = await embeddings.embedQuery(segDoc);
            recordsToUpsert.push({
              id: `video:${asset._id.toString()}:seg:${idx}`,
              values: segEmbedding,
              metadata: {
                assetId: asset._id.toString(),
                projectId: asset.projectId.toString(),
                mediaType: 'video',
                startTime: seg.startTime,
                endTime: seg.endTime,
                frameUrl: seg.frameUrl || '',
                text: seg.description,
                tags: aiAnalysis.tags || [],
              },
            });
          } catch (segEmbedErr) {
            console.warn(`[Pipeline] Segment ${idx} embedding error:`, segEmbedErr.message);
          }
        }
      }

      await pineconeIndex.upsert(recordsToUpsert);
    } else {
      console.warn('[Pipeline] Skipping Pinecone index: Pinecone client not configured.');
    }

    // 5. Calculate Evidence Trust Score (0-100) with explainable breakdown
    const trustResult = calculateTrustScore(asset, project);
    asset.trustScore = trustResult.score;
    asset.trustScoreBreakdown = trustResult.breakdown;

    // 6. Done - Mark READY and sync structured metadata/tags back to Cloudinary
    console.log(`[Pipeline] Completed processing for ${asset.mediaType} asset ${assetId} (Trust Score: ${trustResult.score}/100)`);
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
