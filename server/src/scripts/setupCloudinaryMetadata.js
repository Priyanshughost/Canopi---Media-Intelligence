import { v2 as cloudinary } from 'cloudinary';
import { config, validateEnv } from '../config/env.js';

validateEnv();

cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret,
});

/**
 * Metadata field definitions for Cloudinary Structured Custom Metadata
 */
const METADATA_FIELDS = [
  {
    external_id: 'project_id',
    label: 'Project ID',
    type: 'string',
    mandatory: false,
  },
  {
    external_id: 'location',
    label: 'Location',
    type: 'string',
    mandatory: false,
  },
  {
    external_id: 'verified',
    label: 'Verified Status',
    type: 'string',
    mandatory: false,
  },
  {
    external_id: 'tags',
    label: 'AI Impact Tags',
    type: 'string',
    mandatory: false,
  },
];

export const setupCloudinaryMetadata = async () => {
  console.log('🚀 [Setup] Initializing Cloudinary Structured Custom Metadata Schema...');

  try {
    // 1. Fetch existing metadata fields to avoid duplicate errors
    let existingFields = [];
    try {
      const res = await cloudinary.api.list_metadata_fields();
      existingFields = res.metadata_fields || [];
      console.log(
        `📋 [Setup] Found ${existingFields.length} existing metadata fields in Cloudinary.`
      );
    } catch (listErr) {
      console.warn(`⚠️ [Setup] Could not list existing metadata fields: ${listErr.message}`);
    }

    const existingExternalIds = new Set(existingFields.map((f) => f.external_id));

    // 2. Create missing fields
    for (const field of METADATA_FIELDS) {
      if (existingExternalIds.has(field.external_id)) {
        console.log(`✅ [Setup] Metadata field '${field.external_id}' already exists. Skipping.`);
      } else {
        try {
          console.log(`⏳ [Setup] Creating metadata field '${field.external_id}' (${field.label})...`);
          const created = await cloudinary.api.add_metadata_field(field);
          console.log(`✨ [Setup] Successfully created metadata field: ${created.external_id}`);
        } catch (createErr) {
          if (createErr.message && createErr.message.includes('already exists')) {
            console.log(`✅ [Setup] Metadata field '${field.external_id}' already exists.`);
          } else {
            console.warn(
              `⚠️ [Setup] Could not create structured field '${field.external_id}' via Admin API (${createErr.message}). ` +
                `Context metadata fallback will continue to operate seamlessly on all plan tiers.`
            );
          }
        }
      }
    }

    console.log('🎉 [Setup] Cloudinary Structured Metadata setup complete!\n');
  } catch (error) {
    console.error('❌ [Setup] Failed to complete Cloudinary metadata setup:', error.message);
  }
};

// If run directly via CLI
if (import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  setupCloudinaryMetadata()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
