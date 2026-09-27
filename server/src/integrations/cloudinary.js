import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env.js';
import {
  cloudinaryIntelligenceService,
  uploadWithIntelligence,
  findDuplicatesByPhash,
  extractGpsFromMetadata,
  assessAndEnhanceAsset,
  syncAssetMetadataToCloudinary,
  generateSignedAssetUrl,
} from '../services/cloudinaryIntelligence.js';

cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret,
});

export const cloudinaryService = {
  uploadImage: async (filePath, folder = 'canopi') => {
    try {
      const { cloudResult } = await uploadWithIntelligence(filePath, {
        mediaType: 'image',
        folder,
      });
      return cloudResult;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  },

  uploadVideo: async (filePath, folder = 'canopi') => {
    try {
      const { cloudResult } = await uploadWithIntelligence(filePath, {
        mediaType: 'video',
        folder,
      });
      return cloudResult;
    } catch (error) {
      console.error('Cloudinary video upload error:', error);
      throw error;
    }
  },

  uploadWithIntelligence,
  findDuplicatesByPhash,
  extractGpsFromMetadata,
  assessAndEnhanceAsset,
  syncAssetMetadataToCloudinary,
  generateSignedAssetUrl,

  deleteAsset: async (publicId, resourceType = 'image') => {
    try {
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      return result;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw error;
    }
  },
};

export {
  cloudinary,
  cloudinaryIntelligenceService,
  syncAssetMetadataToCloudinary,
  generateSignedAssetUrl,
};

