import { Project } from './project.model.js';
import { MediaAsset } from '../assets/asset.model.js';
import { Evidence } from '../evidence/evidence.model.js';
import { cloudinaryService } from '../../integrations/cloudinary.js';
import { getProjectTimelineHandler } from './project.timeline.js';
import { getProjectLocationsHandler } from './project.locations.js';
import { paraphraseProjectDescription } from '../../ai/groq.js';

export const getProjectStats = async (req, res, next) => {
  try {
    const orgId = req.user?.organizationId;
    const projectFilter = orgId ? { organizationId: orgId } : {};
    
    // Find all projects belonging to user's organization
    const orgProjects = await Project.find(projectFilter).select('_id');
    const orgProjectIds = orgProjects.map((p) => p._id);

    const [activeProjects, totalAssets, verifiedEvidence] = await Promise.all([
      Project.countDocuments({ ...projectFilter, status: 'ACTIVE' }),
      MediaAsset.countDocuments({ projectId: { $in: orgProjectIds } }),
      Evidence.countDocuments({ projectId: { $in: orgProjectIds }, verified: true }),
    ]);

    res.json({
      activeProjects,
      totalAssets,
      verifiedEvidence,
    });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const projectData = {
      ...req.body,
      organizationId: req.user?.organizationId || req.body.organizationId,
      createdBy: req.user?.userId || req.body.createdBy,
    };
    const project = await Project.create(projectData);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const filter = req.user?.organizationId ? { organizationId: req.user.organizationId } : {};
    const projects = await Project.find(filter).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    if (req.user?.organizationId) {
      filter.organizationId = req.user.organizationId;
    }
    const project = await Project.findOne(filter);
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
    const filter = { _id: req.params.id };
    if (req.user?.organizationId) {
      filter.organizationId = req.user.organizationId;
    }
    const project = await Project.findOneAndUpdate(filter, req.body, {
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
    const filter = { _id: req.params.id };
    if (req.user?.organizationId) {
      filter.organizationId = req.user.organizationId;
    }
    const project = await Project.findOneAndDelete(filter);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const assets = await MediaAsset.find({ projectId: req.params.id });

    for (const asset of assets) {
      try {
        await cloudinaryService.deleteAsset(
          asset.cloudinary.publicId,
          asset.cloudinary.resourceType
        );
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

export const paraphraseDescriptionHandler = async (req, res, next) => {
  try {
    const { description, name, organization, location } = req.body;
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Description text is required for paraphrasing.' });
    }

    const paraphrased = await paraphraseProjectDescription(description, {
      name,
      organization,
      location,
    });

    res.json({
      original: description,
      paraphrased,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectTimeline = getProjectTimelineHandler;
export const getProjectLocations = getProjectLocationsHandler;
export { checkClaimsHandler as checkProjectClaims, getClaimsHandler as getProjectClaims } from '../claims/claim.controller.js';
