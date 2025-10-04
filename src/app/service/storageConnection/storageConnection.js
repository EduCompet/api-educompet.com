// src/app/service/storageConnection/storageConnection.js
import { Storage } from "@google-cloud/storage";

// Check that all required environment variables are present.
if (!process.env.GCP_PRIVATE_KEY || !process.env.GCP_CLIENT_EMAIL || !process.env.GCP_PROJECT_ID) {
  throw new Error(
    "CRITICAL: Google Cloud Storage initialization failed. Missing one or more required environment variables: GCP_PRIVATE_KEY, GCP_CLIENT_EMAIL, GCP_PROJECT_ID."
  );
}

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    // ✅ FIX: Ensure the private key is correctly formatted for deployment
    private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
});

const bucketName = process.env.GCS_BUCKET_NAME;
if (!bucketName) {
  throw new Error("CRITICAL: GCS_BUCKET_NAME environment variable is not set.");
}

const bucket = storage.bucket(bucketName);

export { bucket, storage };