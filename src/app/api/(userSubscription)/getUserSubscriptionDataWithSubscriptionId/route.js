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

// ✅ GET: Fetch specific subscription for a user
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
    const subscriptionId = searchParams.get("subscriptionId");

    if (!userId || !subscriptionId) {
      return withCors(NextResponse.json(
        { success: false, message: "userId and subscriptionId are required" },
        { status: 400 }
      ));
    }

    const userSubDoc = await UserSubscriptionModel.findOne({
      userId,
      "subscriptions.subscriptionId": subscriptionId,
    })
      .populate("subscriptions.subscriptionId", "name description pricingPlans")
      .populate("subscriptions.classId", "name")
      .populate("userId", "fullName email");

    if (!userSubDoc) {
      return withCors(NextResponse.json(
        { success: false, message: "No subscription found for this user" },
        { status: 404 }
      ));
    }

    // ✅ Extract only the matching subscription
    const subscription = userSubDoc.subscriptions.find(
      (sub) => sub.subscriptionId.toString() === subscriptionId
    );

    if (!subscription) {
      return withCors(NextResponse.json(
        { success: false, message: "Subscription not found" },
        { status: 404 }
      ));
    }

    return withCors(NextResponse.json(
      {
        success: true,
        message: "User subscription data retrieved successfully",
        data: {
          user: {
            _id: userSubDoc.userId._id,
            fullName: userSubDoc.userId.fullName,
            email: userSubDoc.userId.email,
          },
          subscription,
        },
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
