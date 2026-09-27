import { parseGpsCoordinate, extractGpsFromMetadata } from './gps.js';
import { calculateHammingDistance, findDuplicatesByPhash } from './phash.js';
import { extractQualityScore, assessAndEnhanceAsset } from './quality.js';
import { attachCloudinaryContext, createDerivedAsset } from './derivatives.js';
import { analyzeWithCloudinaryVision } from './vision.js';
import { syncAssetMetadataToCloudinary } from './metadataSync.js';
import { generateSignedAssetUrl } from './signedUrl.js';
import { analyzeVideoWithCloudinary, generateHighlightReel } from './videoAnalysis.js';
import { uploadWithIntelligence } from './uploader.js';

export {
  parseGpsCoordinate,
  extractGpsFromMetadata,
  calculateHammingDistance,
  findDuplicatesByPhash,
  extractQualityScore,
  assessAndEnhanceAsset,
  attachCloudinaryContext,
  createDerivedAsset,
  analyzeWithCloudinaryVision,
  analyzeVideoWithCloudinary,
  generateHighlightReel,
  syncAssetMetadataToCloudinary,
  generateSignedAssetUrl,
  uploadWithIntelligence,
};

export const cloudinaryIntelligenceService = {
  uploadWithIntelligence,
  extractGpsFromMetadata,
  calculateHammingDistance,
  findDuplicatesByPhash,
  assessAndEnhanceAsset,
  extractQualityScore,
  parseGpsCoordinate,
  attachCloudinaryContext,
  createDerivedAsset,
  analyzeWithCloudinaryVision,
  analyzeVideoWithCloudinary,
  generateHighlightReel,
  syncAssetMetadataToCloudinary,
  generateSignedAssetUrl,
};

export default cloudinaryIntelligenceService;
