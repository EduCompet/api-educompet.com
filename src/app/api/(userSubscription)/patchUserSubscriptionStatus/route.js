import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import UserSubscriptionModel from "@/app/model/userSubscriptionModel/schema";
import { headers } from "next/headers";
import ClassModel from "@/app/model/classDataModel/schema";
import UserModel from "@/app/model/userDataModel/schema";
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

// ✅ PATCH: Update subscription status for a user
export const PATCH = async (req) => {
  const headerList = await headers();
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

    const { userId, subscriptionId, status } = await req.json();

    if (!userId || !subscriptionId || !status) {
      return withCors(NextResponse.json(
        { success: false, message: "userId, subscriptionId and status are required" },
        { status: 400 }
      ));
    }

    // ✅ Allowed statuses
    const validStatuses = ["active", "expired", "cancelled"];
    if (!validStatuses.includes(status)) {
      return withCors(NextResponse.json(
        { success: false, message: `Invalid status. Allowed: ${validStatuses.join(", ")}` },
        { status: 400 }
      ));
    }

    // ✅ Update subscription status
    const updatedDoc = await UserSubscriptionModel.findOneAndUpdate(
      {
        userId,
        "subscriptions.subscriptionId": subscriptionId,
      },
      {
        $set: { "subscriptions.$.status": status },
      },
      { new: true }
    )
      .populate("subscriptions.subscriptionId", "name description pricingPlans")
      .populate("subscriptions.classId", "name")
      .populate("userId", "fullName email");

    if (!updatedDoc) {
      return withCors(NextResponse.json(
        { success: false, message: "No matching subscription found for update" },
        { status: 404 }
      ));
    }

    return withCors(NextResponse.json(
      {
        success: true,
        message: "Subscription status updated successfully",
        data: updatedDoc,
      },
      { status: 200 }
    ));
  } catch (error) {
    console.error("Error updating subscription status:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};
