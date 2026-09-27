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
  checkProjectClaims,
  getProjectClaims,
} from './project.controller.js';

import {
  createProjectCarousel,
  getProjectCarousel,
} from '../carousel/carousel.controller.js';

const router = Router();

router.get('/stats', getProjectStats);
router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id/timeline', getProjectTimeline);
router.get('/:id/locations', getProjectLocations);
router.post('/:id/claims/check', checkProjectClaims);
router.get('/:id/claims', getProjectClaims);
router.post('/:id/carousel', createProjectCarousel);
router.get('/:id/carousel', getProjectCarousel);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

export default router;
