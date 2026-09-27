import { Router } from 'express';
import { generateComparison } from './comparison.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/before-after', generateComparison);

export default router;
