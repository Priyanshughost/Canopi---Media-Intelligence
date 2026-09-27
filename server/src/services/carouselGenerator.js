import { Evidence } from '../modules/evidence/evidence.model.js';
import { MediaAsset } from '../modules/assets/asset.model.js';
import { Project } from '../modules/projects/project.model.js';
import { CarouselPost } from '../modules/carousel/carousel.model.js';
import { calculateHammingDistance } from './cloudinaryIntelligence/phash.js';
import { analyzeWithCloudinaryVision } from './cloudinaryIntelligence/vision.js';
import { selectBestVisualForAsset } from '../modules/reports/report.controller.js';
import { sanitizeCaption } from './visualStoryGenerator.js';
import { performSemanticSearch } from '../ai/chains/semanticSearch.js';

/**
 * Builds a deduplicated pool of all verified candidate images across:
 * (a) Comparison-derived verified evidence source assets
 * (b) All other verified MediaAssets in the media gallery
 * @param {string} projectId
 */
export const getCarouselCandidatePool = async (projectId) => {
  if (!projectId) throw new Error('projectId is required for carousel candidate pool');

  // 1. Fetch verified Evidence items and their populated source assets
  const verifiedEvidence = await Evidence.find({
    projectId,
    verified: true,
  }).populate('sourceAssets');

  const pool = [];
  const seenAssetIds = new Set();
  const seenPublicIds = new Set();

  // (a) Extract from Comparison-derived Evidence
  verifiedEvidence.forEach((ev) => {
    if (Array.isArray(ev.sourceAssets)) {
      ev.sourceAssets.forEach((asset) => {
        if (!asset || !asset.verified) return; // Strict verification rule
        const assetIdStr = String(asset._id);
        const publicId = asset.cloudinary?.publicId;

        if (!seenAssetIds.has(assetIdStr) && (!publicId || !seenPublicIds.has(publicId))) {
          seenAssetIds.add(assetIdStr);
          if (publicId) seenPublicIds.add(publicId);

          const bestVisual = selectBestVisualForAsset(asset);
          const cloudName = asset.cloudinary?.cloudName || 'djlbyyev9';
          const videoThumb =
            asset.thumbnailUrl ||
            `https://res.cloudinary.com/${cloudName}/video/upload/c_thumb,w_600,h_400,so_0,f_jpg/${publicId}.jpg`;

          pool.push({
            asset,
            sourceAssetId: asset._id,
            publicId: publicId || asset.originalFilename,
            source: 'comparison',
            evidenceTitle: ev.title,
            phash: asset.phash || null,
            location: asset.location || null,
            mediaType: asset.mediaType || 'image',
            videoUrl: asset.mediaType === 'video' ? asset.cloudinary?.secureUrl : null,
            duration: asset.duration,
            createdAt: asset.createdAt || ev.createdAt || new Date(),
            tags: asset.aiAnalysis?.tags || [],
            description: asset.aiAnalysis?.description || ev.description || '',
            imageUrl: asset.mediaType === 'video' ? videoThumb : bestVisual?.url || asset.cloudinary?.secureUrl,
          });
        }
      });
    }
  });

  // (b) Extract all other verified MediaAssets in the Media Library
  const standaloneAssets = await MediaAsset.find({
    projectId,
    verified: true,
  }).sort({ createdAt: -1 });

  standaloneAssets.forEach((asset) => {
    const assetIdStr = String(asset._id);
    const publicId = asset.cloudinary?.publicId;

    if (!seenAssetIds.has(assetIdStr) && (!publicId || !seenPublicIds.has(publicId))) {
      seenAssetIds.add(assetIdStr);
      if (publicId) seenPublicIds.add(publicId);

      const bestVisual = selectBestVisualForAsset(asset);
      const cloudName = asset.cloudinary?.cloudName || 'djlbyyev9';
      const videoThumb =
        asset.thumbnailUrl ||
        `https://res.cloudinary.com/${cloudName}/video/upload/c_thumb,w_600,h_400,so_0,f_jpg/${publicId}.jpg`;

      pool.push({
        asset,
        sourceAssetId: asset._id,
        publicId: publicId || asset.originalFilename,
        source: 'media_library',
        evidenceTitle: asset.originalFilename || 'Field Media Observation',
        phash: asset.phash || null,
        location: asset.location || null,
        mediaType: asset.mediaType || 'image',
        videoUrl: asset.mediaType === 'video' ? asset.cloudinary?.secureUrl : null,
        duration: asset.duration,
        createdAt: asset.createdAt || new Date(),
        tags: asset.aiAnalysis?.tags || [],
        description: asset.aiAnalysis?.description || '',
        imageUrl: asset.mediaType === 'video' ? videoThumb : bestVisual?.url || asset.cloudinary?.secureUrl,
      });
    }
  });

  return pool;
};

/**
 * Ranks and selects a diverse subset of images using semantic relevance and pHash diversity
 * @param {string} projectId
 * @param {object} options - { query, count: 4..10 }
 */
export const selectCarouselImages = async (projectId, options = {}) => {
  const targetCount = Math.max(3, Math.min(10, options.count || 5));
  const candidatePool = await getCarouselCandidatePool(projectId);

  // Guardrail: Minimum 3 verified images required across both sources
  if (candidatePool.length < 3) {
    const error = new Error(
      `Insufficient verified evidence for a carousel. Found ${candidatePool.length} verified image(s), but at least 3 verified diverse visual assets are required across comparisons and media gallery.`
    );
    error.statusCode = 400;
    throw error;
  }

  const project = await Project.findById(projectId);
  const searchQuery =
    options.query ||
    `${project?.name || ''} ${project?.sector || ''} ${project?.description || ''}`.trim() ||
    'environmental restoration community impact';

  // 1. Compute Semantic Relevance Scores
  let semanticMatches = [];
  try {
    semanticMatches = await performSemanticSearch(searchQuery, { projectId }, 20);
  } catch (err) {
    console.warn('[Carousel Generator] Semantic vector search fallback:', err.message);
  }

  const searchHits = new Map();
  if (Array.isArray(semanticMatches)) {
    semanticMatches.forEach((match, idx) => {
      const assetId = match.metadata?.assetId;
      if (assetId) {
        // Compute decay score 95 -> 70
        searchHits.set(String(assetId), Math.max(70, 95 - idx * 2));
      }
    });
  }

  // Score each candidate asset in the pool
  const scoredCandidates = candidatePool.map((item) => {
    let score = searchHits.get(String(item.sourceAssetId)) || 75;

    // Bonus for matching keywords in description/tags
    const queryLower = searchQuery.toLowerCase();
    const descLower = item.description.toLowerCase();
    const tagMatch = item.tags.some((t) => queryLower.includes(String(t).toLowerCase()));

    if (descLower.includes(queryLower.split(' ')[0])) score += 6;
    if (tagMatch) score += 8;
    if (item.location?.lat) score += 3; // Bonus for GPS verified

    return {
      ...item,
      semanticScore: Math.min(99, score),
    };
  });

  // Sort descending by semantic score
  scoredCandidates.sort((a, b) => b.semanticScore - a.semanticScore);

  // 2. Diversity Selection Heuristic (pHash near-duplicate filtering & source balancing)
  const selected = [];
  const selectedPhashes = [];

  // Pass 1: Try to pick top diverse images while ensuring source balance
  for (const candidate of scoredCandidates) {
    if (selected.length >= targetCount) break;

    // Check pHash distance against already selected images
    let isNearDuplicate = false;
    if (candidate.phash) {
      for (const existingPhash of selectedPhashes) {
        const dist = calculateHammingDistance(candidate.phash, existingPhash);
        if (dist <= 8) {
          isNearDuplicate = true;
          break;
        }
      }
    }

    if (!isNearDuplicate) {
      selected.push(candidate);
      if (candidate.phash) selectedPhashes.push(candidate.phash);
    }
  }

  // Pass 2: If we still need more images to reach targetCount, fill with remaining distinct candidates
  if (selected.length < targetCount) {
    for (const candidate of scoredCandidates) {
      if (selected.length >= targetCount) break;
      if (!selected.some((s) => String(s.sourceAssetId) === String(candidate.sourceAssetId))) {
        selected.push(candidate);
      }
    }
  }

  return selected;
};

/**
 * Generates SEO-ready copy using Cloudinary AI Vision (alt text, individual caption, and carousel hook)
 * @param {Array} selectedAssets
 * @param {object} project
 */
export const generateCarouselCopy = async (selectedAssets, project) => {
  const altPrompt =
    'Describe in 1 factual sentence what is visible in this image for accessibility and SEO alt text.';
  const captionPrompt =
    'Write a one-sentence social media caption highlighting the visible field impact in this image.';

  const processedImages = [];

  for (let i = 0; i < selectedAssets.length; i++) {
    const item = selectedAssets[i];
    const publicId = item.publicId;

    let altText = '';
    let individualCaption = '';

    try {
      const vqaResult = await analyzeWithCloudinaryVision(publicId, [altPrompt, captionPrompt]);
      const answers = vqaResult?.questions || vqaResult?.answers || [];

      if (answers[0]?.answer && !answers[0].answer.toLowerCase().includes('no response returned')) {
        altText = sanitizeCaption(answers[0].answer);
      }
      if (answers[1]?.answer && !answers[1].answer.toLowerCase().includes('no response returned')) {
        individualCaption = sanitizeCaption(answers[1].answer);
      }
    } catch (err) {
      console.warn(`[Carousel Generator] Cloudinary Vision copy error for ${publicId}:`, err.message);
    }

    // Graceful fallbacks using verified data
    if (!altText) {
      altText = sanitizeCaption(
        item.description || `Field evidence photo for ${project.name} showing verified impact.`
      );
    }
    if (!individualCaption) {
      individualCaption = sanitizeCaption(
        item.description || `Documented field progress from ${project.name}.`
      );
    }

    processedImages.push({
      order: i + 1,
      imageUrl: item.imageUrl,
      publicId: item.publicId,
      sourceAssetId: item.sourceAssetId,
      source: item.source,
      altText,
      individualCaption,
      semanticScore: item.semanticScore || 85,
    });
  }

  // Generate Overarching Carousel Copy & Sector Hashtags
  const sector = project.sector || 'Sustainability';
  const sectorTag = `#${sector.replace(/[^a-zA-Z0-9]/g, '')}`;

  // Collect unique asset tags for hashtags
  const tagSet = new Set(['#ImpactVerified', '#FieldEvidence', '#CanopiPlatform', '#Transparency', sectorTag]);
  selectedAssets.forEach((a) => {
    (a.tags || []).slice(0, 2).forEach((t) => {
      const formatted = `#${String(t).replace(/[^a-zA-Z0-9]/g, '')}`;
      if (formatted.length > 2) tagSet.add(formatted);
    });
  });

  const hashtags = Array.from(tagSet).slice(0, 7);

  const comparisonCount = processedImages.filter((img) => img.source === 'comparison').length;
  const mediaCount = processedImages.filter((img) => img.source === 'media_library').length;

  const carouselCaption = `🌿 Verified Impact Field Update: ${project.name}\n\nSwipe through our audited field evidence gallery (${processedImages.length} visual milestones), combining ${comparisonCount} before-and-after change detections and ${mediaCount} field inspection records.\n\nEvery milestone is authenticated with GPS metadata and visual AI verification.`;

  return {
    carouselCaption,
    hashtags,
    images: processedImages,
  };
};

/**
 * End-to-End Orchestrator: Selects candidates, generates SEO copy, and saves CarouselPost
 * @param {string} projectId
 * @param {object} options - { query, count, reportId }
 */
export const generateCarouselPost = async (projectId, options = {}) => {
  const project = await Project.findById(projectId);
  if (!project) throw new Error('Project not found');

  // 1. Select diverse images from combined verified pool
  const selectedAssets = await selectCarouselImages(projectId, options);

  // 2. Generate Cloudinary AI Vision SEO copy
  const copyResult = await generateCarouselCopy(selectedAssets, project);

  // 3. Persist to MongoDB
  const carouselPost = await CarouselPost.create({
    projectId,
    reportId: options.reportId || null,
    carouselCaption: copyResult.carouselCaption,
    hashtags: copyResult.hashtags,
    query: options.query || null,
    images: copyResult.images,
  });

  console.log(
    `[Carousel Generator] Created carousel post ${carouselPost._id} with ${copyResult.images.length} images for project ${projectId}`
  );

  return carouselPost;
};
