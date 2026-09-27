import fs from 'fs/promises';
import { MediaAsset } from './asset.model.js';
import { Project } from '../projects/project.model.js';
import { processAssetPipeline } from './asset.service.js';
import {
  uploadWithIntelligence,
  findDuplicatesByPhash,
} from '../../services/cloudinaryIntelligence/index.js';
import { calculateTrustScore } from '../../services/trustScore.js';
import { cloudinaryService } from '../../integrations/cloudinary.js';

export const uploadAsset = async (req, res, next) => {
  try {
    const { projectId } = req.body;
    const file = req.file;

    console.log('[Asset Controller] Upload requested', { projectId, filename: file?.originalname });

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }
    if (!file) {
      return res.status(400).json({ error: 'file is required' });
    }

    const projectFilter = { _id: projectId };
    if (req.user?.organizationId) {
      projectFilter.organizationId = req.user.organizationId;
    }
    const project = await Project.findOne(projectFilter);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Determine media type based on mimetype
    const mediaType = file.mimetype.startsWith('video/') ? 'video' : 'image';

    // 1. Upload to Cloudinary with native intelligence (metadata, phash, colors, quality_analysis, eager derivatives, moderation)
      const {
        cloudResult,
        exifLocation,
        duration,
        thumbnailUrl,
        streamingUrl,
        phash,
        qualityAnalysis,
        colors,
        enhancedVersion,
        derivatives,
        moderation,
        flaggedForReview,
      } = await uploadWithIntelligence(file.path, {
        mediaType,
        folder: 'canopi',
      });

    // 2. Determine Location: EXIF if available, otherwise manual from body if provided
    let location = undefined;
    if (exifLocation) {
      location = {
        lat: exifLocation.lat,
        lng: exifLocation.lng,
        latitude: exifLocation.lat,
        longitude: exifLocation.lng,
        source: 'exif',
      };
    } else if (req.body.lat !== undefined && req.body.lng !== undefined) {
      const lat = parseFloat(req.body.lat);
      const lng = parseFloat(req.body.lng);
      location = {
        lat,
        lng,
        latitude: lat,
        longitude: lng,
        source: 'manual',
        name: req.body.locationName,
      };
    }

    // 3. Find near-duplicate phash matches in existing assets
    let possibleDuplicates = [];
    if (phash) {
      possibleDuplicates = await findDuplicatesByPhash(phash, null, {
        projectId: req.body.matchProjectOnly ? projectId : undefined,
      });
      console.log(
        `[Asset Controller] Duplicates found for pHash ${phash}:`,
        possibleDuplicates.length
      );
    }

    // 4. Calculate Initial Evidence Trust Score
    const initialTrust = calculateTrustScore(
      {
        location,
        phash,
        qualityAnalysis,
        flaggedForReview,
        possibleDuplicates,
      },
      project
    );

    // 5. Create Asset Record in MongoDB with full derivatives traceability chain and moderation flags
    const asset = await MediaAsset.create({
      projectId,
      originalFilename: file.originalname,
      mediaType,
      duration,
      thumbnailUrl,
      streamingUrl,
      location,
      phash,
      qualityAnalysis,
      colors,
      enhancedVersion,
      derivatives: derivatives || [],
      moderation: moderation || [],
      flaggedForReview: Boolean(flaggedForReview),
      trustScore: initialTrust.score,
      trustScoreBreakdown: initialTrust.breakdown,
      metadata: cloudResult.image_metadata || cloudResult.exif || {},
      cloudinary: {
        publicId: cloudResult.public_id,
        resourceType: cloudResult.resource_type,
        assetType: cloudResult.type,
        secureUrl: cloudResult.secure_url,
        version: String(cloudResult.version),
        format: cloudResult.format,
        width: cloudResult.width,
        height: cloudResult.height,
        duration: cloudResult.duration,
        bytes: cloudResult.bytes,
      },
      processingStatus: 'UPLOADED',
    });

    // 6. Trigger async AI processing pipeline without awaiting it
    processAssetPipeline(asset._id, file.path, file.mimetype).catch(console.error);

    // 7. Expose possibleDuplicates & trustScore in response along with asset fields
    res.status(201).json({
      ...asset.toObject(),
      possibleDuplicates,
    });
  } catch (error) {
    next(error);
  }
};

export const getAssetDerivatives = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log('[Asset Controller] Fetching derivatives for asset ID', { id });

    const asset = await MediaAsset.findById(id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json({
      assetId: id,
      publicId: asset.cloudinary.publicId,
      originalUrl: asset.cloudinary.secureUrl,
      derivatives: asset.derivatives || [],
    });
  } catch (error) {
    next(error);
  }
};

export const createDerivative = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { purpose, transformation, transformationOptions } = req.body;

    console.log('[Asset Controller] Creating on-demand derivative', { id, purpose, transformation });

    const asset = await MediaAsset.findById(id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const { createDerivedAsset } = await import('../../services/cloudinaryIntelligence.js');
    const result = await createDerivedAsset(asset._id, {
      purpose: purpose || 'campaign_post',
      transformation: transformation || 'c_fill,g_auto,w_1080,h_1080,q_auto,f_auto',
      transformationOptions,
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getAssetDuplicates = async (req, res, next) => {
  try {
    const { id } = req.params;
    const threshold = req.query.threshold ? parseInt(req.query.threshold, 10) : undefined;
    const matchProjectOnly = req.query.matchProjectOnly === 'true';

    console.log('[Asset Controller] Checking duplicates for asset ID', { id, threshold });

    const asset = await MediaAsset.findById(id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    if (!asset.phash) {
      return res.json({ assetId: id, phash: null, duplicates: [] });
    }

    const duplicates = await findDuplicatesByPhash(asset.phash, threshold, {
      excludeAssetId: asset._id,
      projectId: matchProjectOnly ? asset.projectId : undefined,
    });

    res.json({
      assetId: id,
      phash: asset.phash,
      duplicates,
    });
  } catch (error) {
    next(error);
  }
};

export const getAssets = async (req, res, next) => {
  try {
    const { projectId, type } = req.query;
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

    if (type) filter.mediaType = type;

    console.log('[Asset Controller] Fetching assets', { filter });

    const assets = await MediaAsset.find(filter).sort({ createdAt: -1 });
    res.json(assets);
  } catch (error) {
    next(error);
  }
};

export const getAssetById = async (req, res, next) => {
  try {
    console.log('[Asset Controller] Fetching asset by ID', { id: req.params.id });
    const asset = await MediaAsset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json(asset);
  } catch (error) {
    next(error);
  }
};

export const deleteAsset = async (req, res, next) => {
  try {
    console.log('[Asset Controller] Deleting asset', { id: req.params.id });
    const asset = await MediaAsset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Delete from Cloudinary
    await cloudinaryService.deleteAsset(asset.cloudinary.publicId, asset.cloudinary.resourceType);

    // Delete from DB
    await asset.deleteOne();

    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const analyzeAssetWithCloudinaryVision = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { questions } = req.body;

    console.log('[Asset Controller] Analyzing asset with Cloudinary Vision VQA', { id, questions });

    const asset = await MediaAsset.findById(id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const { analyzeWithCloudinaryVision: runCloudinaryVision } = await import(
      '../../services/cloudinaryIntelligence.js'
    );
    const visionAnalysis = await runCloudinaryVision(asset.cloudinary.publicId, questions);

    asset.cloudinaryVisionAnalysis = visionAnalysis;
    await asset.save();

    res.json({
      assetId: id,
      cloudinaryVisionAnalysis: visionAnalysis,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tags, location, projectId, verified } = req.body;

    console.log('[Asset Controller] Updating asset and syncing to Cloudinary', {
      id,
      tags,
      location,
      projectId,
      verified,
    });

    const asset = await MediaAsset.findById(id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    if (projectId) asset.projectId = projectId;
    if (verified !== undefined) asset.verified = Boolean(verified);
    if (tags) {
      if (!asset.aiAnalysis) asset.aiAnalysis = {};
      asset.aiAnalysis.tags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());
    }
    if (location) {
      asset.location = {
        ...asset.location,
        ...(typeof location === 'object' ? location : { name: location }),
      };
    }

    await asset.save();

    // Sync changes to Cloudinary
    const { syncAssetMetadataToCloudinary } = await import(
      '../../services/cloudinaryIntelligence.js'
    );
    const syncResult = await syncAssetMetadataToCloudinary(asset);

    res.json({
      asset,
      syncResult,
    });
  } catch (error) {
    next(error);
  }
};

export const syncAssetMetadata = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log('[Asset Controller] Manual Cloudinary metadata sync requested', { id });

    const asset = await MediaAsset.findById(id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const { syncAssetMetadataToCloudinary } = await import(
      '../../services/cloudinaryIntelligence.js'
    );
    const result = await syncAssetMetadataToCloudinary(asset);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getSignedAssetUrl = async (req, res, next) => {
  try {
    const { id } = req.params;
    const expiresInSeconds = req.body?.expiresInSeconds || req.query?.expiresInSeconds || 3600;
    const transformation = req.body?.transformation || {};
    const attachment = Boolean(req.body?.attachment || req.query?.attachment);

    console.log('[Asset Controller] Generating signed URL for asset', { id, expiresInSeconds });

    const asset = await MediaAsset.findById(id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const { generateSignedAssetUrl } = await import(
      '../../services/cloudinaryIntelligence.js'
    );

    const signedData = generateSignedAssetUrl(asset.cloudinary.publicId, {
      expiresInSeconds: Number(expiresInSeconds),
      resourceType: asset.cloudinary.resourceType || 'image',
      type: asset.cloudinary.assetType || 'upload',
      transformation,
      attachment,
    });

    res.json({
      assetId: id,
      verified: asset.verified,
      originalFilename: asset.originalFilename,
      ...signedData,
    });
  } catch (error) {
    next(error);
  }
};

export const getAssetTrustScore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const asset = await MediaAsset.findById(id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const project = await Project.findById(asset.projectId);
    const trustResult = calculateTrustScore(asset, project);

    asset.trustScore = trustResult.score;
    asset.trustScoreBreakdown = trustResult.breakdown;
    await asset.save();

    res.json({
      assetId: id,
      trustScore: trustResult.score,
      trustScoreBreakdown: trustResult.breakdown,
      checkedAt: new Date(),
    });
  } catch (error) {
    next(error);
  }
};

export const reviewAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { flaggedForReview } = req.body;
    const asset = await MediaAsset.findById(id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Toggle or explicitly set flaggedForReview
    asset.flaggedForReview = typeof flaggedForReview === 'boolean' ? flaggedForReview : false;
    await asset.save();

    res.json({
      success: true,
      message: 'Asset review status updated',
      asset,
    });
  } catch (error) {
    next(error);
  }
};

export const reAnalyzeAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const asset = await MediaAsset.findById(id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Run pipeline synchronously or trigger and return
    await processAssetPipeline(asset._id, null, asset.mediaType === 'video' ? 'video/mp4' : 'image/jpeg');
    const updatedAsset = await MediaAsset.findById(id);

    res.json({
      success: true,
      message: 'Asset AI analysis re-processed successfully',
      asset: updatedAsset,
    });
  } catch (error) {
    next(error);
  }
};

export const reAnalyzeProjectAssets = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const assets = await MediaAsset.find({ projectId });
    
    // Process all unanalyzed assets sequentially with small delay to prevent rate limits
    for (const asset of assets) {
      if (!asset.aiAnalysis?.description) {
        await processAssetPipeline(asset._id, null, asset.mediaType === 'video' ? 'video/mp4' : 'image/jpeg');
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    const updatedAssets = await MediaAsset.find({ projectId });
    res.json({
      success: true,
      message: 'All project assets re-analyzed',
      assets: updatedAssets,
    });
  } catch (error) {
    next(error);
  }
};
