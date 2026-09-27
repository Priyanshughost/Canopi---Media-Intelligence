import { Router } from 'express';
import {
  createEvidence,
  getEvidence,
  verifyEvidence,
  deleteEvidence
} from './evidence.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', createEvidence);
router.get('/', getEvidence);
router.put('/:id/verify', verifyEvidence);
router.delete('/:id', deleteEvidence);

export default router;
