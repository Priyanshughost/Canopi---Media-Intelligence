import { cloudinary } from './config.js';

/**
 * Synchronizes MongoDB metadata, tags, and verification status back into Cloudinary
 */
export const syncAssetMetadataToCloudinary = async (asset) => {
  if (!asset || !asset.cloudinary?.publicId) {
    return { success: false, reason: 'Asset or Cloudinary publicId missing' };
  }

  const publicId = asset.cloudinary.publicId;
  const projectId = asset.projectId ? asset.projectId.toString() : '';
  const verifiedStr = asset.verified ? 'true' : 'false';

  let locationStr = 'Not Specified';
  if (asset.location) {
    if (asset.location.name) {
      locationStr = asset.location.name;
    } else if (asset.location.lat !== undefined && asset.location.lng !== undefined) {
      locationStr = `${asset.location.lat},${asset.location.lng}`;
    }
  }

  const tagsList = asset.aiAnalysis?.tags || [];
  const tagsStr = tagsList.slice(0, 8).join(', ');

  console.log(`[Metadata Sync] Syncing metadata to Cloudinary for ${publicId}:`, {
    projectId,
    location: locationStr,
    verified: verifiedStr,
    tags: tagsStr,
  });

  const syncResults = {
    publicId,
    structuredMetadata: null,
    contextMetadata: null,
    tags: null,
  };

  // 1. Sync Cloudinary Structured Custom Metadata (via update_metadata)
  try {
    const metadataPayload = {
      project_id: projectId,
      location: locationStr,
      verified: verifiedStr,
      tags: tagsStr,
    };
    const updateMetaRes = await cloudinary.uploader.update_metadata(metadataPayload, [publicId]);
    syncResults.structuredMetadata = { success: true, response: updateMetaRes };
    console.log(`[Metadata Sync] Structured custom metadata updated successfully for ${publicId}`);
  } catch (metaErr) {
    console.warn(
      `[Metadata Sync] Structured custom metadata update skipped/failed: ${metaErr.message}`
    );
    syncResults.structuredMetadata = { success: false, error: metaErr.message };
  }

  // 2. Sync Cloudinary Context Metadata (via explicit/add_context) for fallback durability
  try {
    const contextPayload = {
      projectId,
      location: locationStr,
      verified: verifiedStr,
      tags: tagsStr,
      lastSyncedAt: new Date().toISOString(),
    };
    const explicitRes = await cloudinary.uploader.explicit(publicId, {
      type: 'upload',
      resource_type: asset.cloudinary.resourceType || 'image',
      context: contextPayload,
    });
    syncResults.contextMetadata = { success: true, response: explicitRes };
    console.log(`[Metadata Sync] Context metadata updated successfully for ${publicId}`);
  } catch (ctxErr) {
    console.warn(`[Metadata Sync] Context metadata update skipped/failed: ${ctxErr.message}`);
    syncResults.contextMetadata = { success: false, error: ctxErr.message };
  }

  // 3. Sync Cloudinary Native Tags
  if (Array.isArray(tagsList) && tagsList.length > 0) {
    try {
      await cloudinary.uploader.replace_tag(tagsList.join(','), [publicId]);
      syncResults.tags = { success: true, tags: tagsList };
      console.log(`[Metadata Sync] Cloudinary tags synced for ${publicId}: ${tagsList.join(', ')}`);
    } catch (tagErr) {
      console.warn(`[Metadata Sync] Tag sync skipped/failed: ${tagErr.message}`);
      syncResults.tags = { success: false, error: tagErr.message };
    }
  }

  return {
    success: true,
    publicId,
    syncResults,
  };
};
