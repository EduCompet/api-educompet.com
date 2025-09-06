// src/app/api/(userSubscription)/getUserSubscriptionDataWithUserId/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import UserSubscriptionModel from "@/app/model/userSubscriptionModel/schema";
import UserModel from "@/app/model/userDataModel/schema"; // 👈 Import UserModel
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const GET = async (req) => {
  const headerList = await headers();
  const reqApiKey = headerList.get("x-api-key");

  if (xkey !== reqApiKey) {
    return withCors(NextResponse.json({ success: false, message: "Invalid API Auth Key" }, { status: 401 }));
  }

  try {
    await connectdb();

    const { searchParams } = new URL(req.url);
    const firebaseUid = searchParams.get("userId"); // This is the Firebase UID from the client

    if (!firebaseUid) {
      return withCors(NextResponse.json({ success: false, message: "userId is required" }, { status: 400 }));
    }

    // 1. Find the user by their Firebase UID to get the MongoDB _id
    const user = await UserModel.findOne({ firebaseUid: firebaseUid });
    if (!user) {
      return withCors(NextResponse.json({ success: false, message: "User not found" }, { status: 404 }));
    }

    // 2. Use the user's MongoDB _id to find their subscriptions
    const userSubDoc = await UserSubscriptionModel.findOne({ userId: user._id })
      .populate("subscriptions.subscriptionId", "name description pricingPlans")
      .populate("subscriptions.classId", "name");

    if (!userSubDoc) {
      return withCors(NextResponse.json({ success: false, message: "No subscription found for this user" }, { status: 404 }));
    }

    return withCors(NextResponse.json({
      success: true,
      message: "User subscription data retrieved successfully",
      data: userSubDoc,
    }, { status: 200 }));
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return withCors(NextResponse.json({ success: false, message: error.message || "Internal Server Error" }, { status: 500 }));
  }
};