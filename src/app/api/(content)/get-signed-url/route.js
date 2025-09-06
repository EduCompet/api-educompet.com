// src/app/api/(content)/get-signed-url/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import { bucket } from "@/app/service/storageConnection/storageConnection";
import UserModel from "@/app/model/userDataModel/schema";
import UserSubscriptionModel from "@/app/model/userSubscriptionModel/schema";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = "force-dynamic";
const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const POST = async (req) => {
  const headerList = await headers();
  const reqApiKey = headerList.get("x-api-key");

  if (xkey !== reqApiKey) {
    return withCors(NextResponse.json({ success: false, message: "Invalid API Auth Key" }, { status: 401 }));
  }

  try {
    await connectdb();
    const { firebaseUid, classId, filePath } = await req.json();

    if (!firebaseUid || !classId || !filePath) {
      return withCors(NextResponse.json({ success: false, message: "firebaseUid, classId, and filePath are required." }, { status: 400 }));
    }

    // 1. Find the user by their Firebase UID
    const user = await UserModel.findOne({ firebaseUid });
    if (!user) {
      return withCors(NextResponse.json({ success: false, message: "User not found" }, { status: 404 }));
    }

    // 2. Check if the user has an active subscription for the requested class
    const userSubDoc = await UserSubscriptionModel.findOne({ userId: user._id });
    if (!userSubDoc || !userSubDoc.subscriptions) {
      return withCors(NextResponse.json({ success: false, message: "You do not have an active subscription." }, { status: 403 }));
    }

    const now = new Date();
    const hasActiveSubForClass = userSubDoc.subscriptions.some(sub =>
      sub.classId.toString() === classId &&
      sub.status === 'active' &&
      sub.expireDate > now
    );

    if (!hasActiveSubForClass) {
      return withCors(NextResponse.json({ success: false, message: "Your subscription for this class has expired or is inactive." }, { status: 403 }));
    }

    // 3. If authorized, generate a signed URL for the file
    const file = bucket.file(filePath);
    const expiration = Date.now() + 15 * 60 * 1000; // URL expires in 15 minutes

    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: expiration,
    });

    return withCors(NextResponse.json({ success: true, url: signedUrl }, { status: 200 }));

  } catch (error) {
    console.error("Error generating signed URL:", error);
    return withCors(NextResponse.json({ success: false, message: error.message || "Internal Server Error" }, { status: 500 }));
  }
};