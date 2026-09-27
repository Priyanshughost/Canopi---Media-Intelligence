import { Router } from 'express';
import { semanticSearch } from './search.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/semantic', semanticSearch);

export default router;
