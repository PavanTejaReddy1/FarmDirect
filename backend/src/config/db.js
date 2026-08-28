const mongoose = require("mongoose");

/**
 * Connect to MongoDB using MONGODB_URI from environment.
 * Throws a clear error on startup if the URI is missing — the server
 * should never silently proceed without a database connection.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Copy .env.example to .env and fill in your connection string."
    );
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection failed: ${err.message}`);
    // Exit so the process doesn't run without a database
    process.exit(1);
  }
}

module.exports = connectDB;
