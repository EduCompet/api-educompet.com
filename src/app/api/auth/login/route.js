// src/app/api/auth/login/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import UserModel from "@/app/model/userDataModel/schema";
import { withCors, handleOptions } from "@/app/utils/cors";
import crypto from 'crypto';
import admin from "@/app/utils/firebaseAdmin"; // Ensure firebase-admin is initialized

export async function OPTIONS() {
  return handleOptions();
}

export const POST = async (req) => {
  try {
    await connectdb();
    const { email, password, fcmToken } = await req.json();

    if (!email || !password) {
      return withCors(NextResponse.json({ success: false, message: "Email and password are required." }, { status: 400 }));
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return withCors(NextResponse.json({ success: false, message: "Invalid email or password." }, { status: 401 }));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return withCors(NextResponse.json({ success: false, message: "Invalid email or password." }, { status: 401 }));
    }

    // --- Single Device Login Logic ---

    // 1. Get the OLD FCM token before we overwrite it.
    const oldFcmToken = user.fcmToken;

    // 2. Generate a new session token for the new device.
    const sessionToken = crypto.randomBytes(64).toString('hex');
    user.sessionToken = sessionToken;
    user.lastLogin = new Date();
    if (fcmToken) {
      user.fcmToken = fcmToken; // Overwrite with the new token
    }
    await user.save();

// 3. If an old token existed, send a logout notification to it.
if (oldFcmToken && oldFcmToken !== fcmToken) {
  const message = {
    token: oldFcmToken,
    data: {
      type: 'LOGOUT',
      title: 'Session Expired',
      body: 'You have been logged out because your account was signed into on a new device.'
    },
    notification: {
      title: 'Session Expired',
      body: 'You have been signed in on another device.'
    }
  };

  try {
    const resp = await admin.messaging().send(message);
    console.log('Successfully sent logout message to old device:', oldFcmToken, 'response:', resp);
  } catch (error) {
    // More verbose debug: sometimes error objects hide properties; show everything
    console.error('Error sending FCM logout message:', error);
    try {
      console.error('Error keys:', Object.getOwnPropertyNames(error));
      console.error('Error JSON:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    } catch (e) {
      // ignore stringify failures
    }

    // Defensive handling: detect common messaging errors and handle them
    const errCode = (error && (error.code || error.errorInfo?.code || '')).toString();
    const errMsg = (error && (error.message || '')).toString();

    // Common problems to treat as non-fatal and optionally clean up DB:
    const isTokenNotRegistered = errCode.includes('registration-token-not-registered') ||
                                 errCode.includes('invalid-registration-token') ||
                                 errMsg.includes('Requested entity was not found') ||
                                 errMsg.includes('not found');

    const isInvalidRecipient = errCode.includes('invalid-recipient') || errMsg.includes('Invalid');

    if (isTokenNotRegistered || isInvalidRecipient) {
      console.log('FCM token appears invalid or unregistered. Will remove stale token if still present in DB.');

      // Remove the stale token from DB only if it still equals the old value (defensive)
      try {
        const latestUser = await UserModel.findById(user._id).exec();
        if (latestUser && latestUser.fcmToken === oldFcmToken) {
          latestUser.fcmToken = null;
          await latestUser.save();
          console.log('Cleared stale fcmToken for user:', user._id);
        } else {
          console.log('Stored token changed already, no DB update needed.');
        }
      } catch (dbErr) {
        console.error('Failed to clear stale fcmToken from DB:', dbErr);
      }
    } else {
      // Other unpredictable errors — log and proceed with login (do not block login)
      console.warn('Unhandled FCM send error — proceeding with login. Inspect logs for details.');
    }
  }
}
    // --- End Single Device Login Logic ---

    // Determine if the user has completed their profile (e.g., has phone number)
    const hasCompletedProfile = !!user.phone && user.phone.trim().length > 0;

    return withCors(NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        token: sessionToken,
        userId: user._id,
        email: user.email,
        fullName: user.fullName,
        hasCompletedProfile: hasCompletedProfile,
      },
    }, { status: 200 }));

  } catch (error) {
    console.error("Login error:", error);
    return withCors(NextResponse.json({ success: false, message: "An internal server error occurred." }, { status: 500 }));
  }
};