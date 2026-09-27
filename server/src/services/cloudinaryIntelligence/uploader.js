import { cloudinary } from './config.js';
import { config } from '../../config/env.js';
import { extractGpsFromMetadata } from './gps.js';
import { assessAndEnhanceAsset } from './quality.js';

/**
 * Enhanced upload handler requesting native AI, eager transformations, pHash, metadata, and quality analysis
 */
export const uploadWithIntelligence = async (filePath, options = {}) => {
  const { mediaType = 'image', folder = 'canopi', customThreshold } = options;

  console.log(
    `[Cloudinary Intelligence] Uploading ${mediaType} with eager derivatives, native AI, and context metadata...`
  );

  // 1. Configure Eager Transformations for thumbnail and 16:9 report crop
  let eagerTransforms = [];
  if (mediaType === 'video') {
    eagerTransforms = [
      { width: 400, height: 400, crop: 'thumb', gravity: 'auto', quality: 'auto', format: 'jpg' },
      { aspect_ratio: '16:9', width: 1200, crop: 'fill', gravity: 'auto', quality: 'auto', format: 'jpg' },
    ];
  } else {
    eagerTransforms = [
      { width: 400, height: 400, crop: 'thumb', gravity: 'auto', quality: 'auto', fetch_format: 'auto' },
      { aspect_ratio: '16:9', width: 1200, crop: 'fill', gravity: 'auto', quality: 'auto', fetch_format: 'auto' },
    ];
  }

  const notificationUrl = options.notificationUrl || config.cloudinary.notificationUrl;

  let uploadOptions = {
    folder,
    image_metadata: true,
    quality_analysis: true,
    moderation: 'manual', // Triggers Cloudinary content safety / compliance moderation analysis
    eager: eagerTransforms,
    context: {
      purpose: 'original',
      platform: 'canopi',
    },
  };

  if (notificationUrl) {
    uploadOptions.notification_url = notificationUrl;
    uploadOptions.eager_async = true;
    console.log(`[Cloudinary Intelligence] Configured webhook notification_url: ${notificationUrl}`);
  }

  if (mediaType === 'video') {
    uploadOptions = {
      ...uploadOptions,
      resource_type: 'video',
      media_metadata: true,
    };
  } else {
    uploadOptions = {
      ...uploadOptions,
      resource_type: 'image',
      colors: true,
      phash: true,
    };
  }

  const cloudResult = await cloudinary.uploader.upload(filePath, uploadOptions);

  console.log(`[Cloudinary Intelligence] Upload complete. Public ID: ${cloudResult.public_id}`);

  // 2. Extract EXIF GPS coordinates if present
  const exifLocation = extractGpsFromMetadata(cloudResult.image_metadata || cloudResult.exif);

  // 3. Extract moderation analysis
  const moderationResult = cloudResult.moderation || [];
  const flaggedForReview = moderationResult.some(
    (m) => m.status === 'rejected' || m.status === 'pending'
  );

  // 4. Build Derivatives Traceability Chain
  const derivatives = [];

  if (Array.isArray(cloudResult.eager) && cloudResult.eager.length >= 2) {
    // Thumbnail Derivative
    derivatives.push({
      public_id: cloudResult.public_id,
      publicId: cloudResult.public_id,
      url: cloudResult.eager[0].secure_url || cloudResult.eager[0].url,
      transformation:
        cloudResult.eager[0].transformation || 'c_thumb,g_auto,w_400,h_400,q_auto,f_auto',
      purpose: 'thumbnail',
      linkedToOriginal: cloudResult.public_id,
      width: cloudResult.eager[0].width,
      height: cloudResult.eager[0].height,
      bytes: cloudResult.eager[0].bytes,
      format: cloudResult.eager[0].format,
      createdAt: new Date(),
    });

    // Report 16:9 Crop Derivative
    derivatives.push({
      public_id: cloudResult.public_id,
      publicId: cloudResult.public_id,
      url: cloudResult.eager[1].secure_url || cloudResult.eager[1].url,
      transformation:
        cloudResult.eager[1].transformation || 'c_fill,ar_16:9,g_auto,w_1200,q_auto,f_auto',
      purpose: 'report_crop',
      linkedToOriginal: cloudResult.public_id,
      width: cloudResult.eager[1].width,
      height: cloudResult.eager[1].height,
      bytes: cloudResult.eager[1].bytes,
      format: cloudResult.eager[1].format,
      createdAt: new Date(),
    });
  }

  // 5. Evaluate Quality and perform Generative Restore if poor
  let enhancedVersion = null;
  if (mediaType === 'image') {
    enhancedVersion = await assessAndEnhanceAsset(cloudResult, customThreshold);
    if (enhancedVersion) {
      derivatives.push({
        public_id: cloudResult.public_id,
        publicId: cloudResult.public_id,
        url: enhancedVersion,
        transformation: 'e_gen_restore',
        purpose: 'enhanced',
        linkedToOriginal: cloudResult.public_id,
        createdAt: new Date(),
      });
    }
  }

  return {
    cloudResult,
    exifLocation,
    phash: cloudResult.phash || null,
    qualityAnalysis: cloudResult.quality_analysis || null,
    colors: cloudResult.colors || [],
    enhancedVersion,
    derivatives,
    moderation: moderationResult,
    flaggedForReview,
  };
};
