import { MediaAsset } from '../assets/asset.model.js';
import { processAssetPipeline } from '../assets/asset.service.js';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../../config/env.js';

/**
 * Handles incoming Cloudinary webhooks (upload completion, eager transformations, moderation results)
 */
export const handleCloudinaryWebhook = async (req, res, next) => {
  try {
    const payload = req.body;
    const signature = req.headers['x-cld-signature'];
    const timestamp = req.headers['x-cld-timestamp'];

    console.log('\n╭───────────────── [CLOUDINARY WEBHOOK RECEIVED] ───────────────────');
    console.log(`│ [Public ID]: ${payload?.public_id || payload?.asset_id || 'N/A'}`);
    console.log(`│ [Notification Type]: ${payload?.notification_type || 'upload/eager'}`);
    console.log(`│ [Status]: ${payload?.moderation_status || payload?.status || 'completed'}`);
    console.log('╰───────────────────────────────────────────────────────────────────\n');

    // 1. Signature verification (if Cloudinary signature headers provided)
    if (signature && timestamp && config.cloudinary.api_secret) {
      try {
        const isValid = cloudinary.utils.verifyNotificationSignature(
          JSON.stringify(payload),
          timestamp,
          signature,
          config.cloudinary.api_secret
        );
        if (!isValid) {
          console.warn('[Webhook Controller] Cloudinary webhook signature validation failed. Proceeding with payload check.');
        } else {
          console.log('[Webhook Controller] Cloudinary webhook signature verified successfully.');
        }
      } catch (sigErr) {
        console.warn(`[Webhook Controller] Signature verification check error: ${sigErr.message}`);
      }
    }

    const publicId = payload?.public_id;
    if (!publicId) {
      return res.status(200).json({ received: true, warning: 'No public_id in webhook payload' });
    }

    // 2. Find associated MediaAsset in MongoDB
    const asset = await MediaAsset.findOne({
      $or: [
        { 'cloudinary.publicId': publicId },
        { 'derivatives.public_id': publicId },
      ],
    });

    if (!asset) {
      console.log(`[Webhook Controller] No MediaAsset found matching public_id: ${publicId}`);
      return res.status(200).json({ received: true, matched: false, publicId });
    }

    let updated = false;

    // 3. Update Eager Derivatives if present in webhook payload
    if (Array.isArray(payload.eager) && payload.eager.length > 0) {
      console.log(`[Webhook Controller] Ingesting ${payload.eager.length} eager derivatives for ${publicId}`);
      const existingUrls = new Set((asset.derivatives || []).map((d) => d.url));

      for (const eagerItem of payload.eager) {
        const eagerUrl = eagerItem.secure_url || eagerItem.url;
        if (!existingUrls.has(eagerUrl)) {
          asset.derivatives.push({
            public_id: publicId,
            publicId: publicId,
            url: eagerUrl,
            transformation: eagerItem.transformation || 'custom',
            purpose: 'derived',
            linkedToOriginal: publicId,
            width: eagerItem.width,
            height: eagerItem.height,
            bytes: eagerItem.bytes,
            format: eagerItem.format,
            createdAt: new Date(),
          });
          existingUrls.add(eagerUrl);
          updated = true;
        }
      }
    }

    // 4. Update Moderation status if present
    if (payload.moderation || payload.moderation_status) {
      const moderationList = payload.moderation || [
        {
          kind: 'manual',
          status: payload.moderation_status,
          updated_at: new Date(),
        },
      ];

      asset.moderation = moderationList;
      asset.flaggedForReview = moderationList.some(
        (m) => m.status === 'rejected'
      );
      updated = true;
      console.log(`[Webhook Controller] Moderation status updated: flaggedForReview=${asset.flaggedForReview}`);
    }

    if (updated) {
      await asset.save();
    }

    // 5. Trigger Next Pipeline Stage (Vision AI + Pinecone Embeddings) if still in UPLOADED status
    let nextStageTriggered = false;
    if (asset.processingStatus === 'UPLOADED') {
      console.log(`[Webhook Controller] Webhook triggering next stage pipeline for asset ${asset._id}`);
      nextStageTriggered = true;
      // Trigger pipeline asynchronously
      processAssetPipeline(asset._id, null, asset.mediaType === 'video' ? 'video/mp4' : 'image/jpeg').catch((err) =>
        console.error(`[Webhook Controller] Pipeline error:`, err)
      );
    }

    return res.status(200).json({
      received: true,
      matched: true,
      assetId: asset._id,
      processingStatus: asset.processingStatus,
      nextStageTriggered,
    });
  } catch (error) {
    console.error('[Webhook Controller] Error processing webhook:', error);
    // Cloudinary expects 200 to acknowledge receipt and avoid endless retries
    return res.status(200).json({ received: true, error: error.message });
  }
};
