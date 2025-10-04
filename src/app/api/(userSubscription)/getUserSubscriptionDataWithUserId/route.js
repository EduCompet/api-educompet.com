// src/app/api/(userSubscription)/getUserSubscriptionDataWithUserId/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import UserSubscriptionModel from "@/app/model/userSubscriptionModel/schema";
import UserModel from "@/app/model/userDataModel/schema";
import SubscriptionModel from "@/app/model/subscriptionsDataModel/schema";
import ClassModel from "@/app/model/classDataModel/schema";
import TransactionModel from "@/app/model/transactionModel/schema";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";
import mongoose from "mongoose"; // Import mongoose

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
    const userId = searchParams.get("userId"); // This is the MongoDB _id from the app

    if (!userId) {
      return withCors(NextResponse.json({ success: false, message: "userId is required" }, { status: 400 }));
    }

    // ✅ FIX: Validate the incoming ID and find the user by their MongoDB _id
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return withCors(NextResponse.json({ success: false, message: "Invalid User ID format" }, { status: 400 }));
    }
    const user = await UserModel.findById(userId);
    
    if (!user) {
      return withCors(NextResponse.json({ success: false, message: "User not found" }, { status: 404 }));
    }

    const userSubDoc = await UserSubscriptionModel.findOne({ userId: user._id })
      .populate("subscriptions.subscriptionId", "name")
      .populate("subscriptions.classId", "name")
      .populate("subscriptions.transaction_Id", "transactionId");

    if (!userSubDoc) {
      return withCors(NextResponse.json({
        success: true,
        message: "No subscription document found for this user.",
        data: { subscriptions: [] },
      }, { status: 200 }));
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