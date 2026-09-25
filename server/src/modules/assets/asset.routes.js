import { Router } from 'express';
import {
  uploadAsset,
  getAssets,
  getAssetById,
  deleteAsset,
} from './asset.controller.js';
import { upload } from '../../middleware/upload.js';

const router = Router();

// Endpoint for uploading single media file
router.post('/upload', upload.single('file'), uploadAsset);

router.get('/', getAssets);
router.get('/:id', getAssetById);
router.delete('/:id', deleteAsset);

export default router;
