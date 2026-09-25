import { MediaAsset } from '../assets/asset.model.js';
import { compareImages } from '../../ai/chains/compareImages.js';
import { Evidence } from '../evidence/evidence.model.js';

export const generateComparison = async (req, res, next) => {
  try {
    const { beforeAssetId, afterAssetId, projectId } = req.body;
    
    console.log('[Comparison Controller] Generation requested', { beforeAssetId, afterAssetId, projectId });

    if (!beforeAssetId || !afterAssetId) {
      return res.status(400).json({ error: 'Both beforeAssetId and afterAssetId are required' });
    }

    const beforeAsset = await MediaAsset.findById(beforeAssetId);
    const afterAsset = await MediaAsset.findById(afterAssetId);

    if (!beforeAsset || !afterAsset) {
      return res.status(404).json({ error: 'One or both assets not found' });
    }

    if (beforeAsset.mediaType !== 'image' || afterAsset.mediaType !== 'image') {
      return res.status(400).json({ error: 'Both assets must be images for visual comparison' });
    }

    console.log(`[Comparison Controller] Calling Gemini for comparison...`);
    const analysis = await compareImages(beforeAsset.cloudinary.secureUrl, afterAsset.cloudinary.secureUrl);

    // Automatically generate an Evidence record draft
    const evidenceDraft = new Evidence({
      projectId: projectId || beforeAsset.projectId,
      title: 'Before/After Visual Comparison',
      description: analysis.summary,
      type: 'comparison',
      sourceAssets: [beforeAssetId, afterAssetId],
      observations: analysis.observations,
      generatedBy: {
        provider: 'Google',
        model: 'gemini-1.5-pro'
      }
    });

    res.json({
      comparison: analysis,
      draftEvidence: evidenceDraft // UI can use this to let user save the evidence
    });
  } catch (error) {
    next(error);
  }
};
