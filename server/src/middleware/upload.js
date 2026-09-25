import multer from 'multer';
import path from 'path';

// Use memory storage for direct Cloudinary stream upload, 
// or disk storage for temp file upload then to Cloudinary.
// We'll use disk storage for simplicity in this MVP to avoid memory bloat with large videos.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // We can use the OS temp dir or a local uploads folder.
    // Ensure this folder exists if using local.
    cb(null, '/tmp'); // On Windows, multer might fallback to %temp% if configured properly, but let's use os.tmpdir()
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

import os from 'os';
storage.getDestination = (req, file, cb) => {
    cb(null, os.tmpdir());
}

export const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max limit for MVP
  },
});
