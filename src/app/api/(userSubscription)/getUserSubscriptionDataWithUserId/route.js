// src/app/api/(userSubscription)/getUserSubscriptionDataWithUserId/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import UserSubscriptionModel from "@/app/model/userSubscriptionModel/schema";
import { headers } from "next/headers";
import ClassModel from "@/app/model/classDataModel/schema";
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}


// ✅ GET: Fetch all subscriptions for a user
export const GET = async (req) => {
  const headerList =await headers();
  const reqApiKey = headerList.get("x-api-key");

  // 🔑 Validate API Key
  if (xkey !== reqApiKey) {
    return withCors(NextResponse.json(
      { success: false, message: "Invalid API Auth Key" },
      { status: 401 }
    ));
  }

  try {
    await connectdb();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return withCors(NextResponse.json(
        { success: false, message: "userId is required" },
        { status: 400 }
      ));
    }

    const userSubDoc = await UserSubscriptionModel.findOne({ userId })
      .populate("subscriptions.subscriptionId", "name description pricingPlans")
      .populate("subscriptions.classId", "name");
      // .populate("userId", "fullName email"); // Remove this line

    if (!userSubDoc) {
      return withCors(NextResponse.json(
        { success: false, message: "No subscription found for this user" },
        { status: 404 }
      ));
    }

    return withCors(NextResponse.json(
      {
        success: true,
        message: "User subscription data retrieved successfully",
        data: userSubDoc,
      },
      { status: 200 }
    ));
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};