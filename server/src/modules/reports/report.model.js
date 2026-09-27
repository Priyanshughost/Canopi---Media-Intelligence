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
