import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    claimText: {
      type: String,
      required: true,
      trim: true,
    },
    claimType: {
      type: String,
      enum: ['quantity', 'activity', 'outcome'],
      default: 'activity',
    },
    subject: {
      type: String,
      default: '',
      trim: true,
    },
    verdict: {
      type: String,
      enum: ['SUPPORTED', 'PARTIALLY_SUPPORTED', 'UNSUPPORTED', 'INSUFFICIENT_EVIDENCE'],
      required: true,
    },
    reasoning: {
      type: String,
      required: true,
    },
    supportingAssetIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MediaAsset',
      },
    ],
    vqaInsights: [
      {
        question: String,
        answer: String,
        assetId: String,
      },
    ],
    checkedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Claim = mongoose.model('Claim', claimSchema);
