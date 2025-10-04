// src/app/api/(userSubscription)/postUserSubscriptionData/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import UserSubscriptionModel from "@/app/model/userSubscriptionModel/schema";
import UserModel from "@/app/model/userDataModel/schema";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const PUT = async (req) => {
  const headerList = await headers();
  const reqApiKey = headerList.get("x-api-key");

  if (xkey !== reqApiKey) {
    return withCors(NextResponse.json(
      { success: false, message: "Invalid API Auth Key" },
      { status: 401 }
    ));
  }

  try {
    await connectdb();

    const body = await req.json();
    const { firebaseUid, subscriptionId, classId, startDate, expireDate, status, durationMonths, amountPaid } = body;

    if (!firebaseUid || !subscriptionId || !classId || !startDate || !expireDate || durationMonths == null || amountPaid == null ) {
      return withCors(NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      ));
    }

    const user = await UserModel.findOne({ firebaseUid });
    if (!user) {
      return withCors(NextResponse.json({ success: false, message: "User not found" }, { status: 404 }));
    }

    const userId = user._id;

    const updatedUserSubDoc = await UserSubscriptionModel.findOneAndUpdate(
      { userId: userId },
      {
        $push: {
          subscriptions: {
            subscriptionId,
            classId,
            startDate,
            expireDate,
            status,
            durationMonths,
            amountPaid,
          },
        },
      },
      { new: true, upsert: true }
    );

    return withCors(NextResponse.json(
      {
        success: true,
        message: "Subscription added successfully",
        data: updatedUserSubDoc,
      },
      { status: 200 }
    ));
  } catch (error) {
    console.error("Error updating user subscription:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};