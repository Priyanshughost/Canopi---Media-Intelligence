import { cloudinary } from './config.js';
import { MediaAsset } from '../../modules/assets/asset.model.js';

/**
 * Attaches context metadata to Cloudinary assets for full traceability
 */
export const attachCloudinaryContext = async (publicId, { purpose, linked_to }) => {
  if (!publicId) return;
  try {
    const contextStr = `purpose=${purpose || 'custom'}|linked_to=${linked_to || publicId}`;
    await cloudinary.uploader.add_context(contextStr, [publicId]);
    console.log(`[Cloudinary Traceability] Context attached to ${publicId}: ${contextStr}`);
  } catch (err) {
    console.warn(`[Cloudinary Traceability] Context attachment skipped:`, err.message);
  }
};

/**
 * Creates a derived asset from an original with full traceability
 */
export const createDerivedAsset = async (sourceAssetId, transformationOptions = {}) => {
  const sourceAsset = await MediaAsset.findById(sourceAssetId);
  if (!sourceAsset) {
    throw new Error('Source asset not found');
  }

  const {
    transformation,
    purpose = 'campaign_post',
    customPublicId,
    format,
  } = transformationOptions;

  const originalPublicId = sourceAsset.cloudinary.publicId;

  console.log(
    `[Cloudinary Traceability] Creating derived asset for ${originalPublicId} with purpose: ${purpose}`
  );

  const derivedPublicId =
    customPublicId ||
    `canopi/derivatives/${purpose}_${Date.now()}_${originalPublicId.split('/').pop()}`;

  // Execute explicit transformation
  const explicitResult = await cloudinary.uploader.explicit(originalPublicId, {
    type: 'upload',
    resource_type: sourceAsset.cloudinary.resourceType || 'image',
    eager: [
      {
        transformation,
        format,
        public_id: derivedPublicId,
      },
    ],
    context: {
      purpose,
      linked_to: originalPublicId,
      source_asset_id: sourceAsset._id.toString(),
      created_at: new Date().toISOString(),
    },
  });

  const eagerData = explicitResult.eager?.[0] || {};
  const derivedUrl =
    eagerData.secure_url ||
    cloudinary.url(originalPublicId, {
      transformation,
      secure: true,
      format,
    });

  const derivativeRecord = {
    public_id: derivedPublicId,
    publicId: derivedPublicId,
    url: derivedUrl,
    transformation:
      typeof transformation === 'string' ? transformation : JSON.stringify(transformation),
    purpose,
    linkedToOriginal: originalPublicId,
    width: eagerData.width,
    height: eagerData.height,
    bytes: eagerData.bytes,
    format: eagerData.format || format,
    createdAt: new Date(),
  };

  // Attach context metadata on Cloudinary for bidirectional traceability
  await attachCloudinaryContext(derivedPublicId, {
    purpose,
    linked_to: originalPublicId,
  });

  // Append derivative to parent asset
  if (!sourceAsset.derivatives) {
    sourceAsset.derivatives = [];
  }
  sourceAsset.derivatives.push(derivativeRecord);
  await sourceAsset.save();

  return {
    sourceAssetId,
    derivative: derivativeRecord,
  };
};
