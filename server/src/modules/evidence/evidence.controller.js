import { Evidence } from './evidence.model.js';
import { MediaAsset } from '../assets/asset.model.js';
import { syncAssetMetadataToCloudinary } from '../../services/cloudinaryIntelligence.js';

export const createEvidence = async (req, res, next) => {
  try {
    const evidence = await Evidence.create(req.body);
    res.status(201).json(evidence);
  } catch (error) {
    next(error);
  }
};

export const getEvidence = async (req, res, next) => {
  try {
    const { projectId, verified } = req.query;
    const filter = {};
    if (projectId) filter.projectId = projectId;
    if (verified !== undefined) filter.verified = verified === 'true';

    const evidenceList = await Evidence.find(filter)
      .populate('sourceAssets', 'cloudinary.secureUrl mediaType aiAnalysis')
      .sort({ createdAt: -1 });
    res.json(evidenceList);
  } catch (error) {
    next(error);
  }
};

export const verifyEvidence = async (req, res, next) => {
  try {
    const { id } = req.params;
    // In a real app with auth, verifiedBy would be req.user._id
    const evidence = await Evidence.findByIdAndUpdate(
      id,
      {
        verified: true,
        verifiedAt: new Date(),
        // verifiedBy: req.user._id
      },
      { new: true }
    );

    if (!evidence) {
      return res.status(404).json({ error: 'Evidence not found' });
    }

    // Update verified status on all linked source assets and sync to Cloudinary
    if (Array.isArray(evidence.sourceAssets) && evidence.sourceAssets.length > 0) {
      await MediaAsset.updateMany(
        { _id: { $in: evidence.sourceAssets } },
        { $set: { verified: true } }
      );

      // Trigger metadata sync to Cloudinary for each source asset
      for (const assetId of evidence.sourceAssets) {
        syncAssetMetadataToCloudinary(assetId, { verified: true }).catch((syncErr) =>
          console.warn(`[Evidence Verification] Cloudinary sync warning for asset ${assetId}:`, syncErr.message)
        );
      }
    }

    res.json(evidence);
  } catch (error) {
    next(error);
  }
};

export const deleteEvidence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Evidence.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Evidence not found' });
    }
    res.json({ message: 'Evidence deleted successfully' });
  } catch (error) {
    next(error);
  }
};
