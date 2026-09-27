import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectStats,
  getProjectTimeline,
  getProjectLocations,
} from './project.controller.js';

const router = Router();

router.get('/stats', getProjectStats);
router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id/timeline', getProjectTimeline);
router.get('/:id/locations', getProjectLocations);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

export default router;
