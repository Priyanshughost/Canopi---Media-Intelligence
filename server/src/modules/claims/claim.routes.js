import { Router } from 'express';
import { checkClaimsHandler, getClaimsHandler } from './claim.controller.js';

const router = Router({ mergeParams: true });

router.post('/check', checkClaimsHandler);
router.get('/', getClaimsHandler);

export default router;
