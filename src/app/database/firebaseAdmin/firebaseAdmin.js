// import admin from "firebase-admin";

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert({
//       projectId: process.env.FIREBASE_PROJECT_ID,
//       clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//       privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
//     }),
//   });
// }

// export default admin;

import admin from "firebase-admin";

// Define required environment variables
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY; // The raw string

// Check if all necessary keys exist
if (!admin.apps.length) {
  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          // Safely replace newline characters, ensuring the key exists
          privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"), 
        }),
      });
      console.log("✅ Firebase Admin SDK initialized successfully.");
    } catch (error) {
      console.error("❌ Firebase Admin SDK initialization failed:", error.message);
      // In a build environment, failing here is still fatal, but it gives a clearer error message.
    }
  } else {
    // This will likely be the message you see in the AWS build log now.
    console.warn("⚠️ Skipping Firebase Admin SDK initialization: Missing one or more required environment variables (Project ID, Client Email, or Private Key).");
  }
}

export default admin;