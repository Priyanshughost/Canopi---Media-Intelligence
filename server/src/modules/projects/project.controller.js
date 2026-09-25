import { Project } from './project.model.js';
import { MediaAsset } from '../assets/asset.model.js';
import { Evidence } from '../evidence/evidence.model.js';
import { cloudinaryService } from '../../integrations/cloudinary.js';

export const getProjectStats = async (req, res, next) => {
  try {
    const [activeProjects, totalAssets, verifiedEvidence] = await Promise.all([
      Project.countDocuments({ status: 'ACTIVE' }),
      MediaAsset.countDocuments(),
      Evidence.countDocuments({ verified: true })
    ]);
    
    res.json({
      activeProjects,
      totalAssets,
      verifiedEvidence
    });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Find all assets for this project
    const assets = await MediaAsset.find({ projectId: req.params.id });
    
    // Delete from Cloudinary and DB
    for (const asset of assets) {
      try {
        await cloudinaryService.deleteAsset(asset.cloudinary.publicId, asset.cloudinary.resourceType);
      } catch (err) {
        console.error('Error deleting from cloudinary', err);
      }
      await asset.deleteOne();
    }

    res.json({ message: 'Project and all associated assets deleted successfully' });
  } catch (error) {
    next(error);
  }
};
