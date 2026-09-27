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
      lat: { type: Number },
      lng: { type: Number },
      latitude: { type: Number },
      longitude: { type: Number },
      source: {
        type: String,
        enum: ['exif', 'manual', 'inferred'],
        default: 'manual',
      },
      name: { type: String },
    },
    phash: { type: String, index: true },
    qualityAnalysis: { type: mongoose.Schema.Types.Mixed },
    colors: { type: mongoose.Schema.Types.Mixed },
    enhancedVersion: { type: String },
    verified: { type: Boolean, default: false },
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
    cloudinaryVisionAnalysis: {
      questions: [
        {
          question: { type: String },
          answer: { type: String },
        },
      ],
      answers: { type: mongoose.Schema.Types.Mixed },
      rawResponse: { type: mongoose.Schema.Types.Mixed },
      analyzedAt: { type: Date },
    },
    moderation: { type: mongoose.Schema.Types.Mixed },
    flaggedForReview: { type: Boolean, default: false },
    processingStatus: {
      type: String,
      enum: ['UPLOADING', 'UPLOADED', 'ANALYZING', 'EMBEDDING', 'INDEXING', 'READY', 'FAILED'],
      default: 'UPLOADED',
    },
    source: {
      type: { type: String }, // e.g., 'frame_extraction', 'original'
      originalAssetId: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaAsset' },
    },
    derivatives: [
      {
        public_id: { type: String },
        publicId: { type: String },
        url: { type: String, required: true },
        transformation: { type: String, required: true },
        purpose: {
          type: String,
          enum: ['thumbnail', 'report_crop', 'enhanced', 'campaign_post', 'custom'],
          required: true,
        },
        linkedToOriginal: {
          type: String, // original asset public_id or asset_id
          required: true,
        },
        width: { type: Number },
        height: { type: Number },
        bytes: { type: Number },
        format: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    transformations: [
      {
        type: String,
        url: String,
        createdAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const AssetDerivative = mongoose.model(
  'AssetDerivative',
  new mongoose.Schema(
    {
      assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaAsset' },
      public_id: { type: String },
      publicId: { type: String },
      url: { type: String, required: true },
      transformation: { type: String, required: true },
      purpose: {
        type: String,
        enum: ['thumbnail', 'report_crop', 'enhanced', 'campaign_post', 'custom'],
        required: true,
      },
      linkedToOriginal: {
        type: String,
        required: true,
      },
      width: { type: Number },
      height: { type: Number },
      bytes: { type: Number },
      format: { type: String },
      createdAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
  )
);

export const MediaAsset = mongoose.model('MediaAsset', mediaAssetSchema);

