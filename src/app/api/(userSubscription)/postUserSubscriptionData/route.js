import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import UserSubscriptionModel from "@/app/model/userSubscriptionModel/schema";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

// ✅ POST: Add or update a user's subscription
export const POST = async (req) => {
  const headerList =await headers();
  const reqApiKey = headerList.get("x-api-key");

  // 🔑 Validate API key
  if (xkey !== reqApiKey) {
    return withCors(NextResponse.json(
      { success: false, message: "Invalid API Auth Key" },
      { status: 401 }
    ));
  }

  try {
    await connectdb();

    const { userId, subscriptionId, classId, startDate, expireDate, status } =
      await req.json();

    if (!userId || !subscriptionId || !classId || !startDate || !expireDate) {
      return withCors(NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      ));
    }

    // Check if user already has a subscription document
    let userSubDoc = await UserSubscriptionModel.findOne({ userId });

    if (!userSubDoc) {
      // create new doc
      userSubDoc = new UserSubscriptionModel({
        userId,
        subscriptions: [
          { subscriptionId, classId, startDate, expireDate, status },
        ],
      });
    } else {
      // push new subscription item
      userSubDoc.subscriptions.push({
        subscriptionId,
        classId,
        startDate,
        expireDate,
        status,
      });
    }

    await userSubDoc.save();

    return withCors(NextResponse.json(
      {
        success: true,
        message: "Subscription added successfully",
        data: userSubDoc,
      },
      { status: 201 }
    ));
  } catch (error) {
    console.error("Error posting user subscription:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};
