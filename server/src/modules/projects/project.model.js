import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    organization: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PLANNED', 'ACTIVE', 'COMPLETED', 'ON_HOLD'],
      default: 'ACTIVE',
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    locations: [
      {
        type: String,
        trim: true,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // required: true, // Optional for MVP if auth isn't fully implemented
    },
  },
  {
    timestamps: true,
  }
);

export const Project = mongoose.model('Project', projectSchema);
