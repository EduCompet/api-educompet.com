import mongoose from "mongoose";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

// --- Mongoose Connection ---
let isMongooseConnected = null;

export async function connectdb() {
  // This environment variable is set by Vercel, but NOT by Google Cloud Build.
  // This will correctly prevent the database connection during the build on Google Cloud.
  if (process.env.NEXT_PUBLIC_VERCEL_ENV) {
    console.log("Build environment detected, skipping database connection.");
    return;
  }

  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }

  if (isMongooseConnected) {
    return;
  }
  
  try {
    const db = await mongoose.connect(MONGODB_URI);
    isMongooseConnected = db.connections[0].readyState;
    console.log("✅ Successfully connected to MongoDB.");
  } catch (error) {
    console.error("🔥 MongoDB connection error:", error);
    throw new Error("Failed to connect to the database.");
  }
}

// --- Native MongoDB Client Connection ---
let mongoClient;
let mongoClientPromise;

if (!MONGODB_URI) {
  console.warn("MONGODB_URI is not defined, native client will not connect.");
} else if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    mongoClient = new MongoClient(MONGODB_URI, {});
    global._mongoClientPromise = mongoClient.connect();
  }
  mongoClientPromise = global._mongoClientPromise;
} else {
  mongoClient = new MongoClient(MONGODB_URI, {});
  mongoClientPromise = mongoClient.connect();
}

export { mongoClientPromise };
