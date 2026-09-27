import jwt from 'jsonwebtoken';
import { Project } from '../modules/projects/project.model.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'canopi_super_secure_jwt_secret_key_2026_jwt';

/**
 * Middleware to authenticate requests using a JWT Bearer token.
 * Extracts userId, organizationId, email, and name and attaches them to req.user.
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please provide a valid Bearer token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      organizationId: decoded.organizationId,
      email: decoded.email,
      name: decoded.name,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
};

/**
 * Helper to verify that a given project belongs to the user's organization.
 * Throws 404 (or returns null) if not found or organization doesn't match to prevent data leakage.
 */
export const verifyProjectOwnership = async (projectId, organizationId) => {
  if (!projectId || !organizationId) return null;
  const project = await Project.findOne({
    _id: projectId,
    organizationId: organizationId,
  });
  return project;
};

/**
 * Middleware to ensure the requested project in req.params.id (or req.body.projectId / req.query.projectId)
 * belongs to req.user.organizationId.
 */
export const scopeToOrganization = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId || req.body.projectId || req.query.projectId;
    if (!projectId) {
      return next();
    }

    // Only check if it's a valid ObjectId
    if (projectId.match(/^[0-9a-fA-F]{24}$/)) {
      const project = await verifyProjectOwnership(projectId, req.user?.organizationId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found or access denied.' });
      }
      req.project = project;
    }
    next();
  } catch (err) {
    next(err);
  }
};
