import mongoose from 'mongoose';

const evidenceSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String, // e.g., 'observation', 'comparison', 'activity'
      required: true,
    },
    sourceAssets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MediaAsset',
      },
    ],
    observations: [
      {
        category: String,
        text: String,
        confidence: Number,
      }
    ],
    generatedBy: {
      provider: String,
      model: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Evidence = mongoose.model('Evidence', evidenceSchema);
