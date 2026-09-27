import mongoose from 'mongoose';

const carouselImageSchema = new mongoose.Schema(
  {
    order: {
      type: Number,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    sourceAssetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MediaAsset',
    },
    source: {
      type: String,
      enum: ['comparison', 'media_library'],
      required: true,
    },
    altText: {
      type: String,
      required: true,
    },
    individualCaption: {
      type: String,
      required: true,
    },
    semanticScore: {
      type: Number,
      default: 85,
    },
  },
  { _id: false }
);

const carouselPostSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
    },
    carouselCaption: {
      type: String,
      required: true,
    },
    hashtags: [
      {
        type: String,
      },
    ],
    query: {
      type: String,
    },
    images: [carouselImageSchema],
  },
  {
    timestamps: true,
  }
);

export const CarouselPost = mongoose.model('CarouselPost', carouselPostSchema);
