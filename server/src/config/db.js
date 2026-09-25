import mongoose from 'mongoose';
import { config } from './env.js';
import { seedDatabase } from '../utils/seed.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.db.uri);
    console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);
    await seedDatabase();
  } catch (error) {
    console.error(`[DB ERROR] Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};
