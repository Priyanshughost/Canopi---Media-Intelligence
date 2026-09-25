import { Router } from 'express';
import { generateComparison } from './comparison.controller.js';

const router = Router();

router.post('/before-after', generateComparison);

export default router;
