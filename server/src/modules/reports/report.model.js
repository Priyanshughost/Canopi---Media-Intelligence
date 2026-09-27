import mongoose from 'mongoose';

const reportBlockSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['heading', 'text', 'image', 'stats', 'callout'],
      required: true,
    },
    headingLevel: {
      type: Number,
      default: 2,
    },
    content: {
      type: String,
    },
    url: {
      type: String,
    },
    caption: {
      type: String,
    },
    sourceAssetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MediaAsset',
    },
    transformation: {
      type: String,
    },
    purpose: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { _id: false }
);

const campaignPostSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      default: 'Social / Campaign',
    },
    headline: {
      type: String,
    },
    caption: {
      type: String,
      required: true,
    },
    suggestedImageUrl: {
      type: String,
    },
    sourceAssetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MediaAsset',
    },
    transformation: {
      type: String,
    },
    hashtags: [String],
  },
  { _id: false }
);

const visualStorySlideSchema = new mongoose.Schema(
  {
    order: {
      type: Number,
      required: true,
    },
    phase: {
      type: String,
      default: 'Observation',
    },
    publicId: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
      required: true,
    },
    sourceAssetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MediaAsset',
    },
  },
  { _id: false }
);

const visualStorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    format: {
      type: String,
      enum: ['story', 'feed'],
      default: 'story',
    },
    provider: {
      type: String,
      default: 'Cloudinary AI Vision',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    slides: [visualStorySlideSchema],
  },
  { _id: false }
);

const platformReelSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ['reels', 'twitter'],
      required: true,
    },
    videoUrl: {
      type: String,
      required: true,
    },
    durationSeconds: {
      type: Number,
      default: 20,
    },
    aspectRatio: {
      type: String,
      default: '9:16',
    },
    rawGroundedCaption: {
      type: String,
      required: true,
    },
    polishedCaption: {
      type: String,
    },
    hashtags: [
      {
        tag: { type: String, required: true },
        source: {
          type: String,
          enum: ['content', 'live_trending', 'curated'],
          default: 'content',
        },
      },
    ],
    sourceSegments: [
      {
        assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaAsset' },
        publicId: String,
        startTime: Number,
        endTime: Number,
        relevanceScore: Number,
        justification: String,
        caption: String,
      },
    ],
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    executiveSummary: {
      type: String,
      required: true,
    },
    keyFindings: [
      {
        type: String,
      },
    ],
    limitations: {
      type: String,
    },
    evidenceUsed: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evidence',
      },
    ],
    reportBlocks: [reportBlockSchema],
    campaignContent: {
      type: String,
    },
    campaignPosts: [campaignPostSchema],
    visualStory: visualStorySchema,
    socialReels: {
      reels: platformReelSchema,
      twitter: platformReelSchema,
    },
    generatedBy: {
      provider: String,
      model: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Report = mongoose.model('Report', reportSchema);
