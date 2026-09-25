import mongoose from 'mongoose';

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
      }
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
    campaignContent: {
      type: String,
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
