import { Router } from 'express';
import {
  uploadAsset,
  getAssets,
  getAssetById,
  getAssetDuplicates,
  getAssetDerivatives,
  getAssetTrustScore,
  createDerivative,
  analyzeAssetWithCloudinaryVision,
  updateAsset,
  syncAssetMetadata,
  getSignedAssetUrl,
  deleteAsset,
  reviewAsset,
  reAnalyzeAsset,
  reAnalyzeProjectAssets,
} from './asset.controller.js';
import { upload } from '../../middleware/upload.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// Protect all asset routes with authentication
router.use(authenticate);

// Endpoint for uploading single media file
router.post('/upload', upload.single('file'), uploadAsset);

router.get('/', getAssets);
router.post('/project/:projectId/re-analyze', reAnalyzeProjectAssets);
router.get('/:id/duplicates', getAssetDuplicates);
router.get('/:id/derivatives', getAssetDerivatives);
router.get('/:id/trust-score', getAssetTrustScore);
router.post('/:id/derivatives', createDerivative);
router.post('/:id/analyze-vision', analyzeAssetWithCloudinaryVision);
router.post('/:id/re-analyze', reAnalyzeAsset);
router.post('/:id/sync-metadata', syncAssetMetadata);
router.get('/:id/signed-url', getSignedAssetUrl);
router.post('/:id/signed-url', getSignedAssetUrl);
router.get('/:id', getAssetById);
router.put('/:id/review', reviewAsset);
router.put('/:id', updateAsset);
router.delete('/:id', deleteAsset);

export default router;
