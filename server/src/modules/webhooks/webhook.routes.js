import express from 'express';
import { handleCloudinaryWebhook } from './webhook.controller.js';

const router = express.Router();

// Cloudinary notification_url webhook endpoint
router.post('/cloudinary', handleCloudinaryWebhook);

// Webhook health check
router.get('/health', (req, res) => {
  res.json({ status: 'active', service: 'cloudinary-webhook-handler' });
});

export default router;
