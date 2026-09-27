import { cloudinary } from './config.js';

/**
 * Generates a signed, time-limited URL for authenticated delivery (e.g. donor portal, external audit)
 */
export const generateSignedAssetUrl = (publicId, optionsOrExpiry = 3600) => {
  if (!publicId) {
    throw new Error('publicId is required to generate signed URL');
  }

  const options =
    typeof optionsOrExpiry === 'number'
      ? { expiresInSeconds: optionsOrExpiry }
      : optionsOrExpiry || {};

  const expiresInSeconds = Number(options.expiresInSeconds) || 3600;
  const resourceType = options.resourceType || 'image';
  const type = options.type || 'upload'; // 'upload', 'authenticated', or 'private'
  const transformation = options.transformation || {};
  const attachment = Boolean(options.attachment);

  const expiresAtUnix = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const expiresAt = new Date(expiresAtUnix * 1000).toISOString();

  // Cloudinary URL options with sign_url enabled
  const urlOptions = {
    resource_type: resourceType,
    type,
    secure: true,
    sign_url: true,
    ...transformation,
  };

  if (attachment) {
    urlOptions.flags = 'attachment';
  }

  const signedUrl = cloudinary.url(publicId, urlOptions);

  return {
    signedUrl,
    publicId,
    expiresAt,
    expiresInSeconds,
    type,
    resourceType,
  };
};
