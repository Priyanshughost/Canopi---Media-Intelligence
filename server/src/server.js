import app from './app.js';
import { config, validateEnv } from './config/env.js';
import { connectDB } from './config/db.js';

const startServer = async () => {
  validateEnv();
  
  // Try to connect to DB, but don't crash if we are just starting and don't have keys yet
  try {
    if (config.db.uri) {
      await connectDB(); 
      console.log('[STARTUP] MongoDB connection initialized');
    }
  } catch (error) {
    console.error('[STARTUP ERROR] Failed to connect to database during startup:', error);
  }

  app.listen(config.port, () => {
    console.log(`[STARTUP] Server is running on port ${config.port}`);
  });
};

startServer();
