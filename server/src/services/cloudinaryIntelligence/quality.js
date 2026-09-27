import { cloudinary } from './config.js';
import { config } from '../../config/env.js';

/**
 * Extracts a normalized 0.0 - 1.0 quality score from Cloudinary quality_analysis object
 */
export const extractQualityScore = (qualityAnalysis) => {
  if (!qualityAnalysis || typeof qualityAnalysis !== 'object') return null;

  if (typeof qualityAnalysis.quality_score === 'number') {
    return qualityAnalysis.quality_score;
  }

  const numericVals = Object.values(qualityAnalysis).filter((v) => typeof v === 'number');
  if (numericVals.length > 0) {
    return numericVals.reduce((sum, v) => sum + v, 0) / numericVals.length;
  }

  return null;
};

/**
 * Eagerly restores/enhances low-quality assets via Cloudinary Generative Restore / Enhance
 */
export const assessAndEnhanceAsset = async (cloudResult, qualityThreshold = null) => {
  if (!cloudResult || !cloudResult.public_id) return null;

  const threshold =
    qualityThreshold !== null && qualityThreshold !== undefined
      ? qualityThreshold
      : config.cloudinary.qualityThreshold || 0.6;

  const qualityScore = extractQualityScore(cloudResult.quality_analysis);

  console.log(
    `[Cloudinary Intelligence] Quality Analysis score: ${qualityScore ?? 'N/A'}, Threshold: ${threshold}`
  );

  // If quality analysis is available and below the configured threshold
  if (qualityScore !== null && qualityScore < threshold) {
    console.log(
      `[Cloudinary Intelligence] Quality score (${qualityScore}) is below threshold (${threshold}). Generating Generative Restore enhancement...`
    );

    try {
      // Trigger eager restoration transformation on Cloudinary
      const explicitRes = await cloudinary.uploader.explicit(cloudResult.public_id, {
        type: 'upload',
        resource_type: cloudResult.resource_type || 'image',
        eager: [{ effect: 'gen_restore' }, { effect: 'enhance' }],
      });

      const eagerUrl = explicitRes?.eager?.[0]?.secure_url;
      if (eagerUrl) {
        console.log(`[Cloudinary Intelligence] Eager Generative Restore completed: ${eagerUrl}`);
        return eagerUrl;
      }
    } catch (explicitErr) {
      console.warn(
        `[Cloudinary Intelligence] Eager explicit transform fallback to derived URL:`,
        explicitErr.message
      );
    }

    // Fallback directly to Cloudinary generative restore transformation URL
    const enhancedUrl = cloudinary.url(cloudResult.public_id, {
      secure: true,
      transformation: [{ effect: 'gen_restore' }],
    });

    console.log(`[Cloudinary Intelligence] Enhanced version URL constructed: ${enhancedUrl}`);
    return enhancedUrl;
  }

  return null;
};
