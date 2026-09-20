import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Connect to MongoDB database using Mongoose
 */
export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      console.warn('⚠️ [Database Warning]: MONGO_URI is not set in environment variables.');
      console.warn('   Please create a .env file based on .env.example to connect to MongoDB.');
      return;
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ [Database]: MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ [Database Error]: Failed to connect to MongoDB - ${error.message}`);
    // In production or when strictly required, exit with failure
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};
