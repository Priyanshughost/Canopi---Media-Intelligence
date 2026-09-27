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

    const cloudName = beforeAsset.cloudinary?.cloudName || 'djlbyyev9';

    const getRepresentativeUrl = (asset) => {
      if (asset.mediaType === 'video') {
        return (
          asset.thumbnailUrl ||
          `https://res.cloudinary.com/${cloudName}/video/upload/c_thumb,w_800,h_600,so_0,f_jpg/${asset.cloudinary.publicId}.jpg`
        );
      }
      return asset.enhancedVersion || asset.cloudinary.secureUrl;
    };

    const beforeUrl = getRepresentativeUrl(beforeAsset);
    const afterUrl = getRepresentativeUrl(afterAsset);

    console.log(`[Comparison Controller] Calling Visual Delta AI for comparison...`, {
      beforeType: beforeAsset.mediaType,
      afterType: afterAsset.mediaType,
    });
    const analysis = await compareImages(beforeUrl, afterUrl);

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
