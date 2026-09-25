import { Router } from 'express';
import { semanticSearch } from './search.controller.js';

const router = Router();

router.post('/semantic', semanticSearch);

export default router;
