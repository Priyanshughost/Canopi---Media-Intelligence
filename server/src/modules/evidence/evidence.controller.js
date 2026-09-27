import { Evidence } from './evidence.model.js';
import { MediaAsset } from '../assets/asset.model.js';
import { Project } from '../projects/project.model.js';
import { syncAssetMetadataToCloudinary } from '../../services/cloudinaryIntelligence.js';
import { calculateTrustScore } from '../../services/trustScore.js';

export const createEvidence = async (req, res, next) => {
  try {
    if (req.body.projectId && req.user?.organizationId) {
      const project = await Project.findOne({ _id: req.body.projectId, organizationId: req.user.organizationId });
      if (!project) {
        return res.status(404).json({ error: 'Project not found or access denied.' });
      }
    }
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

    if (projectId) {
      if (req.user?.organizationId) {
        const project = await Project.findOne({ _id: projectId, organizationId: req.user.organizationId });
        if (!project) {
          return res.status(404).json({ error: 'Project not found or access denied.' });
        }
      }
      filter.projectId = projectId;
    } else if (req.user?.organizationId) {
      const orgProjects = await Project.find({ organizationId: req.user.organizationId }).select('_id');
      const orgProjectIds = orgProjects.map((p) => p._id);
      filter.projectId = { $in: orgProjectIds };
    }

    if (verified !== undefined) filter.verified = verified === 'true';

    const evidenceList = await Evidence.find(filter)
      .populate('projectId', 'title name location category status')
      .populate(
        'sourceAssets',
        'cloudinary.secureUrl mediaType aiAnalysis originalFilename trustScore trustScoreBreakdown location verified flaggedForReview possibleDuplicates'
      )
      .sort({ createdAt: -1 });
    res.json(evidenceList);
  } catch (error) {
    next(error);
  }
};

export const verifyEvidence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = {
      verified: true,
      verifiedAt: new Date(),
    };
    if (req.user?.userId) {
      updateData.verifiedBy = req.user.userId;
    }
    const evidence = await Evidence.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
      .populate('projectId', 'title name location category status')
      .populate(
        'sourceAssets',
        'cloudinary.secureUrl mediaType aiAnalysis originalFilename trustScore trustScoreBreakdown location verified flaggedForReview possibleDuplicates'
      );

    if (!evidence) {
      return res.status(404).json({ error: 'Evidence not found' });
    }

    // Update verified status and recalculate trust score on all linked source assets
    if (Array.isArray(evidence.sourceAssets) && evidence.sourceAssets.length > 0) {
      for (const assetDoc of evidence.sourceAssets) {
        const assetId = assetDoc._id || assetDoc;
        const asset = await MediaAsset.findById(assetId);
        if (asset) {
          asset.verified = true;
          const trust = calculateTrustScore(asset);
          asset.trustScore = trust.score;
          asset.trustScoreBreakdown = trust.breakdown;
          await asset.save();
        }

        // Trigger metadata sync to Cloudinary for each source asset
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
