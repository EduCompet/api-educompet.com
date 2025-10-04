// src/app/api/(users)/has-any-active-subscription/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import UserModel from "@/app/model/userDataModel/schema";
import UserSubscriptionModel from "@/app/model/userSubscriptionModel/schema";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return handleOptions();
}

export const GET = async (req) => {
  // ✅ FIX: Using custom session token instead of Firebase token
  const sessionToken = (await headers()).get("authorization")?.split("Bearer ")[1];

  if (!sessionToken) {
    return withCors(NextResponse.json({ message: "Unauthorized" }, { status: 401 }));
  }

  try {
    await connectdb();

    // ✅ FIX: Find user by sessionToken
    const user = await UserModel.findOne({ sessionToken: sessionToken });
    if (!user) {
      return withCors(NextResponse.json({ success: false, message: "User not found" }, { status: 404 }));
    }

    const userSubDoc = await UserSubscriptionModel.findOne({ userId: user._id });
    if (!userSubDoc || !userSubDoc.subscriptions || userSubDoc.subscriptions.length === 0) {
      return withCors(NextResponse.json({ success: true, hasActiveSubscription: false }));
    }

    const now = new Date();
    const hasAnyActive = userSubDoc.subscriptions.some(sub =>
      sub.status === 'active' && sub.expireDate > now
    );

    return withCors(NextResponse.json({ success: true, hasActiveSubscription: hasAnyActive }));

  } catch (error) {
    console.error("Error checking active subscription:", error);
    return withCors(NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 }));
  }
};