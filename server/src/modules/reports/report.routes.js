import { Router } from 'express';
import { generateReport, getReports, generateCampaign } from './report.controller.js';

const router = Router();

router.post('/generate', generateReport);
router.post('/campaign', generateCampaign);
router.get('/', getReports);

export default router;
