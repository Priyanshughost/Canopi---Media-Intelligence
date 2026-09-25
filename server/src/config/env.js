import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/canopi',
  },
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  },
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT,
    indexName: process.env.PINECONE_INDEX_NAME || 'canopi-index',
  },
  ai: {
    groqApiKey: process.env.GROQ_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    groqModel: process.env.GROQ_MODEL || 'llama3-8b-8192',
  },
};

export const validateEnv = () => {
  const required = [
    'MONGODB_URI',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'PINECONE_API_KEY',
    'PINECONE_ENVIRONMENT',
    'GROQ_API_KEY',
    'GEMINI_API_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`[Config] Missing required environment variables: ${missing.join(', ')}`);
    console.warn('[Config] Ensure these are set in your .env file or environment before running in production.');
  }
};
