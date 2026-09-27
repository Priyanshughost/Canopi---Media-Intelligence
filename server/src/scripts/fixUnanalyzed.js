import mongoose from 'mongoose';
import '../config/env.js';
import { MediaAsset } from '../modules/assets/asset.model.js';
import { processAssetPipeline } from '../modules/assets/asset.service.js';

async function fixUnanalyzed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canopi');
  const allAssets = await MediaAsset.find({});
  const unanalyzed = allAssets.filter((a) => !a.aiAnalysis?.description);
  console.log(`Found ${unanalyzed.length} unanalyzed assets out of ${allAssets.length} total`);

  for (const asset of unanalyzed) {
    console.log(`Processing asset ${asset._id} (${asset.originalFilename})...`);
    try {
      await processAssetPipeline(
        asset._id,
        null,
        asset.mediaType === 'video' ? 'video/mp4' : 'image/jpeg'
      );
      console.log(`Successfully completed pipeline for ${asset._id}`);
    } catch (e) {
      console.error(`Error processing ${asset._id}:`, e.message);
    }
    // Rate limit pause between requests
    await new Promise((r) => setTimeout(r, 1200));
  }

  await mongoose.disconnect();
  console.log('Finished fixing unanalyzed assets.');
}

fixUnanalyzed().catch(console.error);
