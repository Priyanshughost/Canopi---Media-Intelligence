import { cloudinary } from './cloudinaryIntelligence/config.js';
import { analyzeWithCloudinaryVision } from './cloudinaryIntelligence/vision.js';
import { Evidence } from '../modules/evidence/evidence.model.js';
import { MediaAsset } from '../modules/assets/asset.model.js';
import { Report } from '../modules/reports/report.model.js';
import { Project } from '../modules/projects/project.model.js';

/**
 * Strips ungrounded/hallucinated numeric claims and cleans up raw VQA response
 */
export const sanitizeCaption = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return 'Verified field evidence observation.';

  let text = rawText.trim();

  // Remove common LLM/VQA prefixes
  text = text.replace(/^(Caption|Description|Observation|Headline|In this image|The image shows|Here is a caption):\s*/i, '');
  text = text.replace(/^["']|["']$/g, '');

  // Strip hallucinated ungrounded specific numeric figures (e.g., "5432 trees", "98.7% cleaner")
  text = text.replace(/\b\d{3,}\b/g, 'multiple');

  // Limit to single concise sentence (max ~15-20 words)
  const sentences = text.split(/(?<=[.!?])\s+/);
  let firstSentence = sentences[0] || text;
  const words = firstSentence.split(/\s+/);
  if (words.length > 18) {
    firstSentence = words.slice(0, 16).join(' ') + '...';
  }

  return firstSentence.trim();
};

/**
 * Generates Cloudinary transformation URL with social-story aspect ratio and burned-in caption overlay
 * @param {string} publicId - Cloudinary asset public ID
 * @param {string} caption - Slide caption text
 * @param {'story'|'feed'} format - 'story' (1080x1920, 9:16) or 'feed' (1080x1350, 4:5)
 */
export const buildVisualStoryCloudinaryUrl = (publicId, caption, format = 'story') => {
  const isStory = format === 'story';
  const width = 1080;
  const height = isStory ? 1920 : 1350;
  const fontSize = isStory ? 44 : 38;
  const yOffset = isStory ? 140 : 90;

  const cleanCaption = sanitizeCaption(caption);

  // Cloudinary text encoding helper: encode text safely
  const encodedText = encodeURIComponent(cleanCaption.replace(/[\/?:#]/g, ' '));

  try {
    if (typeof cloudinary.url === 'function') {
      const generatedUrl = cloudinary.url(publicId, {
        secure: true,
        transformation: [
          {
            width,
            height,
            crop: 'fill',
            gravity: 'auto',
            quality: 'auto',
            fetch_format: 'auto',
          },
          {
            overlay: {
              font_family: 'Arial',
              font_size: fontSize,
              font_weight: 'bold',
              text: cleanCaption,
              text_align: 'center',
            },
            color: '#ffffff',
            width: 960,
            crop: 'fit',
            gravity: 'south',
            y: yOffset,
            background: 'rgb:000000B0', // Semi-transparent dark box for readability
          },
        ],
      });
      if (generatedUrl) return generatedUrl;
    }
  } catch (err) {
    console.warn('[Visual Story] Cloudinary SDK URL helper error:', err.message);
  }

  const cloudName = cloudinary.config().cloud_name || 'djlbyyev9';
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,g_auto,h_${height},w_${width}/b_rgb:000000B0,c_fit,co_rgb:ffffff,g_south,l_text:Arial_${fontSize}_bold:${encodedText},w_960,y_${yOffset}/${publicId}`;
};

/**
 * Generates a Visual Story for a project & report using Cloudinary AI Vision & Transformations
 * @param {string} projectId - MongoDB Project ID
 * @param {string} reportId - MongoDB Report ID
 * @param {object} options - { format: 'story' | 'feed' }
 */
export const generateVisualStory = async (projectId, reportId, options = {}) => {
  const format = options.format === 'feed' ? 'feed' : 'story';

  if (!projectId || !reportId) {
    throw new Error('projectId and reportId are required to generate a visual story');
  }

  const [project, report] = await Promise.all([
    Project.findById(projectId),
    Report.findById(reportId),
  ]);

  if (!project) throw new Error('Project not found');
  if (!report) throw new Error('Report not found');

  // 1. Gather all verified evidence items for this project
  const verifiedEvidence = await Evidence.find({
    projectId,
    verified: true,
  }).populate('sourceAssets').sort({ createdAt: 1 });

  // Extract all verified source assets
  const candidateAssets = [];
  const seenAssetIds = new Set();

  verifiedEvidence.forEach((ev) => {
    if (Array.isArray(ev.sourceAssets)) {
      ev.sourceAssets.forEach((asset) => {
        if (asset && asset.cloudinary?.publicId && !seenAssetIds.has(String(asset._id))) {
          seenAssetIds.add(String(asset._id));
          candidateAssets.push({
            asset,
            evidenceTitle: ev.title,
            createdAt: asset.createdAt || ev.createdAt || new Date(),
          });
        }
      });
    }
  });

  // If candidateAssets is low, also check directly verified MediaAssets for this project
  if (candidateAssets.length < 2) {
    const directVerifiedAssets = await MediaAsset.find({
      projectId,
      verified: true,
    }).sort({ createdAt: 1 });

    directVerifiedAssets.forEach((asset) => {
      if (asset && asset.cloudinary?.publicId && !seenAssetIds.has(String(asset._id))) {
        seenAssetIds.add(String(asset._id));
        candidateAssets.push({
          asset,
          evidenceTitle: asset.originalFilename || 'Field Observation',
          createdAt: asset.createdAt || new Date(),
        });
      }
    });
  }

  // Guardrail: Minimum 2 verified visual evidence items required
  if (candidateAssets.length < 2) {
    const error = new Error('Insufficient verified visual evidence to construct a visual story. At least 2 verified evidence assets required.');
    error.statusCode = 400;
    throw error;
  }

  // 2. Select chronologically ordered key phases: Before (earliest), During (1-2 intermediate), After (latest)
  candidateAssets.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  let selectedKeyAssets = [];
  if (candidateAssets.length === 2) {
    selectedKeyAssets = [
      { ...candidateAssets[0], phase: 'Initial Baseline State' },
      { ...candidateAssets[1], phase: 'Current Verified Outcome' },
    ];
  } else if (candidateAssets.length === 3) {
    selectedKeyAssets = [
      { ...candidateAssets[0], phase: 'Initial Baseline State' },
      { ...candidateAssets[1], phase: 'Active Field Intervention' },
      { ...candidateAssets[2], phase: 'Current Verified Outcome' },
    ];
  } else {
    // 4 or more: Pick first, 2 spaced in middle, and last
    const first = { ...candidateAssets[0], phase: 'Initial Baseline State' };
    const last = { ...candidateAssets[candidateAssets.length - 1], phase: 'Current Verified Outcome' };
    const midIndex1 = Math.floor(candidateAssets.length / 3);
    const midIndex2 = Math.floor((candidateAssets.length * 2) / 3);

    selectedKeyAssets = [
      first,
      { ...candidateAssets[midIndex1], phase: 'Field Execution' },
      { ...candidateAssets[midIndex2], phase: 'Community Impact' },
      last,
    ];
  }

  // 3. For each image, call Cloudinary AI Vision (or fallback gracefully) for factual 1-sentence caption
  const vqaCaptionPrompt =
    'Write a short, factual, one-sentence caption (max 15 words) describing only what is visibly happening in this image, suitable for a social media impact story. Do not include any numbers, statistics, or claims that cannot be directly seen in the image.';

  const slides = [];
  for (let i = 0; i < selectedKeyAssets.length; i++) {
    const item = selectedKeyAssets[i];
    const asset = item.asset;
    const publicId = asset.cloudinary.publicId;

    let slideCaption = '';

    try {
      // Primary Path: Call Cloudinary AI Vision
      const vqaResult = await analyzeWithCloudinaryVision(publicId, [vqaCaptionPrompt]);
      const vqaAnswer = vqaResult?.questions?.[0]?.answer || vqaResult?.answers?.[0]?.answer;

      if (vqaAnswer && !vqaAnswer.toLowerCase().includes('no response returned')) {
        slideCaption = sanitizeCaption(vqaAnswer);
      }
    } catch (visionErr) {
      console.warn(`[Visual Story] Cloudinary AI Vision call failed for ${publicId}:`, visionErr.message);
    }

    // Graceful Fallback if Cloudinary Vision answer was missing/failed
    if (!slideCaption) {
      const storedVision = asset.cloudinaryVisionAnalysis?.questions?.[0]?.answer;
      const storedAiDesc = asset.aiAnalysis?.description;
      const rawFallback = storedVision || storedAiDesc || item.evidenceTitle || `${project.name} field verification.`;
      slideCaption = sanitizeCaption(rawFallback);
    }

    // Build composed image URL with Cloudinary transformations
    const imageUrl = buildVisualStoryCloudinaryUrl(publicId, slideCaption, format);

    slides.push({
      order: i + 1,
      phase: item.phase,
      publicId,
      imageUrl,
      caption: slideCaption,
      sourceAssetId: asset._id,
    });
  }

  // 4. Generate Overall Story Title/Headline via ONE additional Cloudinary AI Vision call on the LAST image
  const lastAsset = selectedKeyAssets[selectedKeyAssets.length - 1].asset;
  const headlinePrompt =
    'In one short punchy sentence, describe the positive change or current state visible in this image, suitable as a headline for an impact story.';

  let storyTitle = '';
  try {
    const headlineResult = await analyzeWithCloudinaryVision(lastAsset.cloudinary.publicId, [headlinePrompt]);
    const headlineAnswer = headlineResult?.questions?.[0]?.answer || headlineResult?.answers?.[0]?.answer;

    if (headlineAnswer && !headlineAnswer.toLowerCase().includes('no response returned')) {
      storyTitle = sanitizeCaption(headlineAnswer);
    }
  } catch (err) {
    console.warn('[Visual Story] Headline vision call fallback:', err.message);
  }

  if (!storyTitle) {
    storyTitle = `${project.name}: Verified Visual Impact Story`;
  }

  // 5. Store result on Report document
  const visualStory = {
    title: storyTitle,
    format,
    provider: 'Cloudinary AI Vision',
    generatedAt: new Date(),
    slides,
  };

  report.visualStory = visualStory;
  await report.save();

  console.log(`[Visual Story] Successfully generated visual story for report ${reportId} with ${slides.length} slides`);

  return visualStory;
};
