import mongoose from "mongoose";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const options = {};

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

// --- Mongoose Connection ---
let isMongooseConnected = null;

export async function connectdb() {
  if (isMongooseConnected) {
    return;
  }
  const db = await mongoose.connect(MONGODB_URI);
  isMongooseConnected = db.connections[0].readyState;
}

// --- Native MongoDB Client Connection ---
let mongoClient;
let mongoClientPromise;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    mongoClient = new MongoClient(MONGODB_URI, options);
    global._mongoClientPromise = mongoClient.connect();
  }
  mongoClientPromise = global._mongoClientPromise;
} else {
  mongoClient = new MongoClient(MONGODB_URI, options);
  mongoClientPromise = mongoClient.connect();
}

export { mongoClientPromise };
