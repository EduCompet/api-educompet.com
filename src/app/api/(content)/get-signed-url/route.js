// src/app/api/(content)/get-signed-url/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import { bucket } from "@/app/service/storageConnection/storageConnection";
import UserModel from "@/app/model/userDataModel/schema";
import UserSubscriptionModel from "@/app/model/userSubscriptionModel/schema";
import { headers } from "next/headers";
import { withCors, handleOptions } from "@/app/utils/cors";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";
const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() { return handleOptions(); }

export const POST = async (req) => {
  const reqApiKey = (await headers()).get("x-api-key");
  if (xkey !== reqApiKey) {
    return withCors(NextResponse.json({ success: false, message: "Invalid API Auth Key" }, { status: 401 }));
  }

  try {
    await connectdb();
    
    // ✅ FIX: Expect `userId` from the app instead of `firebaseUid`
    const { userId, classId, filePath, generalSubjectId } = await req.json();

    if (!userId || !filePath) {
      return withCors(NextResponse.json({ success: false, message: "userId and filePath are required." }, { status: 400 }));
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return withCors(NextResponse.json({ success: false, message: "Invalid User ID format." }, { status: 400 }));
    }

    // ✅ FIX: Find the user by their MongoDB `_id`
    const user = await UserModel.findById(userId);
    if (!user) {
      return withCors(NextResponse.json({ success: false, message: "User not found" }, { status: 404 }));
    }

    const userSubDoc = await UserSubscriptionModel.findOne({ userId: user._id })
      .populate('subscriptions.subscriptionId', 'isUniversal');

    if (!userSubDoc || !userSubDoc.subscriptions) {
      return withCors(NextResponse.json({ success: false, message: "You do not have an active subscription." }, { status: 403 }));
    }

    const now = new Date();
    let isAuthorized = false;

    const hasAnyActiveSub = userSubDoc.subscriptions.some(s => s.status === 'active' && s.expireDate > now);

    // This logic now correctly handles both general and class-specific content
    if (generalSubjectId) {
        // For general subjects, just check if the user has ANY active subscription
        if (hasAnyActiveSub) {
            isAuthorized = true;
        }
    } else {
        // For class-specific content, check for a universal plan or a plan for that specific class
        for (const sub of userSubDoc.subscriptions) {
            const isActive = sub.status === 'active' && sub.expireDate > now;
            if (isActive) {
                if (sub.subscriptionId && sub.subscriptionId.isUniversal) {
                    isAuthorized = true;
                    break; 
                }
                if (classId && sub.classId && sub.classId.toString() === classId) {
                    isAuthorized = true;
                    break;
                }
            }
        }
    }

    if (!isAuthorized) {
      return withCors(NextResponse.json({ success: false, message: "You are not subscribed to this content." }, { status: 403 }));
    }
    
    const file = bucket.file(filePath);
    // Set URL to expire in 15 minutes for security
    const expiration = Date.now() + 15 * 60 * 1000;
    const [signedUrl] = await file.getSignedUrl({ action: "read", expires: expiration });

    return withCors(NextResponse.json({ success: true, url: signedUrl }, { status: 200 }));

  } catch (error) {
    console.error("Error generating signed URL:", error);
    return withCors(NextResponse.json({ success: false, message: error.message || "Internal Server Error" }, { status: 500 }));
  }
};