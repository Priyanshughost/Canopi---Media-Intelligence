import { Router } from 'express';
import {
  generateReport,
  getReports,
  generateCampaign,
  generateVisualStoryForReport,
  getVisualStoryForReport,
  generateReportHighlightReel,
  getReportHighlightReel,
  generateSocialReelForReport,
  getSocialReelForReport,
} from './report.controller.js';
import {
  createReportCarousel,
  getReportCarousel,
} from '../carousel/carousel.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/generate', generateReport);
router.post('/campaign', generateCampaign);
router.post('/:id/visual-story', generateVisualStoryForReport);
router.get('/:id/visual-story', getVisualStoryForReport);
router.post('/:id/carousel', createReportCarousel);
router.get('/:id/carousel', getReportCarousel);
router.post('/:id/highlight-reel', generateReportHighlightReel);
router.get('/:id/highlight-reel', getReportHighlightReel);
router.post('/:id/reel', generateSocialReelForReport);
router.get('/:id/reel', getSocialReelForReport);
router.get('/', getReports);

export default router;
