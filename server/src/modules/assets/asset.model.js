import mongoose from 'mongoose';

const mediaAssetSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    cloudinary: {
      publicId: { type: String, required: true },
      resourceType: { type: String, required: true }, // 'image' or 'video'
      assetType: { type: String },
      secureUrl: { type: String, required: true },
      version: { type: String },
      format: { type: String },
      width: { type: Number },
      height: { type: Number },
      duration: { type: Number },
      bytes: { type: Number },
    },
    originalFilename: { type: String },
    mediaType: { type: String, enum: ['image', 'video'], required: true },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    capturedAt: { type: Date },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      name: { type: String },
    },
    metadata: { type: mongoose.Schema.Types.Mixed }, // Arbitrary EXIF/metadata
    aiAnalysis: {
      description: { type: String },
      objects: [String],
      activities: [String],
      environment: [String],
      visualSignals: [String],
      detectedText: [String],
      inferredLocation: { name: String, confidence: Number },
      tags: [String],
      observations: [String],
      model: { provider: String, model: String, version: String },
      analyzedAt: { type: Date },
    },
    processingStatus: {
      type: String,
      enum: ['UPLOADING', 'UPLOADED', 'ANALYZING', 'EMBEDDING', 'INDEXING', 'READY', 'FAILED'],
      default: 'UPLOADED',
    },
    source: {
      type: { type: String }, // e.g., 'frame_extraction', 'original'
      originalAssetId: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaAsset' },
    },
    transformations: [
      {
        type: String,
        url: String,
        createdAt: Date,
      }
    ],
  },
  {
    timestamps: true,
  }
);

export const MediaAsset = mongoose.model('MediaAsset', mediaAssetSchema);
