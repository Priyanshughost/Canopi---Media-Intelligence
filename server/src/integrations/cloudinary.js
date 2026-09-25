import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env.js';

cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret,
});

export const cloudinaryService = {
  uploadImage: async (filePath, folder = 'canopi') => {
    try {
      const result = await cloudinary.uploader.upload(filePath, { folder });
      return result;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  },
  
  uploadVideo: async (filePath, folder = 'canopi') => {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: 'video',
      });
      return result;
    } catch (error) {
      console.error('Cloudinary video upload error:', error);
      throw error;
    }
  },

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
