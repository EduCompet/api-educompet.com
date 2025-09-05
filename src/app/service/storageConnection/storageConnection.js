// lib/storage.js
import { Storage } from "@google-cloud/storage";

if (!process.env.GCP_PRIVATE_KEY || !process.env.GCP_CLIENT_EMAIL) {
  throw new Error("GCP credentials missing in environment variables");
}

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
});

const bucketName = process.env.GCS_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

export { bucket, storage };
