import { Router } from 'express';
import {
  createEvidence,
  getEvidence,
  verifyEvidence,
  deleteEvidence
} from './evidence.controller.js';

const router = Router();

router.post('/', createEvidence);
router.get('/', getEvidence);
router.put('/:id/verify', verifyEvidence);
router.delete('/:id', deleteEvidence);

export default router;
