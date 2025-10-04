// src/app/api/(generalSubject)/coreGeneralSubjectData/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import GeneralSubjectModel from "@/app/model/generalSubjectDataModel/schema";
import UserModel from "@/app/model/userDataModel/schema";
import UserSubscriptionModel from "@/app/model/userSubscriptionModel/schema";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return handleOptions();
}

export const GET = async (req) => {
  try {
    await connectdb();
    const headerList = await headers();
    const sessionToken = (headerList.get("authorization") || "").split("Bearer ")[1];

    if (!sessionToken) {
      // Not logged in, so access is denied.
      return withCors(
        NextResponse.json({ success: false, accessDenied: true, message: "Authentication required." }, { status: 401 })
      );
    }

    // Find the user by their custom session token
    const user = await UserModel.findOne({ sessionToken: sessionToken });

    if (!user) {
      // Invalid token
      return withCors(
        NextResponse.json({ success: false, accessDenied: true, message: "Invalid session." }, { status: 401 })
      );
    }
    
    const userSubDoc = await UserSubscriptionModel.findOne({ userId: user._id });
    
    let hasAnyActiveSubscription = false;
    if (userSubDoc) {
        hasAnyActiveSubscription = userSubDoc.subscriptions.some(
            (sub) => sub.status === 'active' && sub.expireDate > new Date()
        );
    }
    
    // If the user has no active subscription, deny access.
    if (!hasAnyActiveSubscription) {
        return withCors(
            NextResponse.json({ success: false, accessDenied: true, message: "An active subscription is required to view this content." }, { status: 403 })
        );
    }

    // If the user has an active subscription, fetch and return all active subjects.
    const subjects = await GeneralSubjectModel.find({ isActive: true })
      .populate("createdBy", "fullName email")
      .populate("allowedClassIds", "name")
      .sort({ createdAt: -1 })
      .lean();

    return withCors(
      NextResponse.json({
        success: true,
        message: "General subjects fetched successfully.",
        data: subjects,
      })
    );
  } catch (error) {
    console.error("Error fetching general subjects:", error);
    return withCors(
      NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 })
    );
  }
};