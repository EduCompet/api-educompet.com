// src/app/utils/firebaseAdmin.js

import admin from "firebase-admin";

const initializeFirebaseAdmin = () => {
  // If already initialized, do nothing.
  if (admin.apps.length > 0) {
    return admin;
  }

  // Check that all required environment variables are present.
  const requiredEnvVars = [
    'GCP_PROJECT_ID',
    'GCP_CLIENT_EMAIL', 
    'GCP_PRIVATE_KEY',
  ];

  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    throw new Error(
      `CRITICAL: Firebase admin initialization failed. Missing environment variables: ${missingEnvVars.join(', ')}`
    );
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.GCP_PROJECT_ID,
        clientEmail: process.env.GCP_CLIENT_EMAIL,
        privateKey: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });

    console.log("✅ Firebase Admin SDK initialized successfully.");
  } catch (error) {
    console.error("🔥 Firebase admin initialization error:", error.stack);
    throw new Error(`Firebase admin initialization failed: ${error.message}`);
  }

  return admin;
};

// Run the initialization logic when this module is first imported.
const adminInstance = initializeFirebaseAdmin();

// Export the initialized admin instance for use in other files.
export default adminInstance;
