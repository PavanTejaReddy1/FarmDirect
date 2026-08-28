const mongoose = require("mongoose");

/**
 * Connect to MongoDB using MONGODB_URI from environment.
 * Reuses active connection in serverless (Vercel) environments.
 */
async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Fill in your MONGODB_URI environment variable."
    );
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection failed: ${err.message}`);
    throw err;
  }
}

module.exports = connectDB;
