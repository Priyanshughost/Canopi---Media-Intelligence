import fs from 'fs/promises';
import { MediaAsset } from './asset.model.js';
import { cloudinaryService } from '../../integrations/cloudinary.js';
import { Project } from '../projects/project.model.js';
import { processAssetPipeline } from './asset.service.js';

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

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Determine media type based on mimetype
    const mediaType = file.mimetype.startsWith('video/') ? 'video' : 'image';

    // Upload to Cloudinary
    let cloudResult;
    if (mediaType === 'video') {
      cloudResult = await cloudinaryService.uploadVideo(file.path);
    } else {
      cloudResult = await cloudinaryService.uploadImage(file.path);
    }

    // Create Asset Record
    const asset = await MediaAsset.create({
      projectId,
      originalFilename: file.originalname,
      mediaType,
      cloudinary: {
        publicId: cloudResult.public_id,
        resourceType: cloudResult.resource_type,
        assetType: cloudResult.type,
        secureUrl: cloudResult.secure_url,
        version: cloudResult.version,
        format: cloudResult.format,
        width: cloudResult.width,
        height: cloudResult.height,
        duration: cloudResult.duration,
        bytes: cloudResult.bytes,
      },
      processingStatus: 'UPLOADED',
    });

    // Trigger async processing job without awaiting it
    processAssetPipeline(asset._id, file.path, file.mimetype).catch(console.error);

    res.status(201).json(asset);
  } catch (error) {
    next(error);
  }
};

export const getAssets = async (req, res, next) => {
  try {
    const { projectId, type } = req.query;
    const filter = {};
    if (projectId) filter.projectId = projectId;
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
