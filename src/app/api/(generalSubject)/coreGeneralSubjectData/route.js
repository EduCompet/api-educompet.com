// src/app/api/(generalSubject)/coreGeneralSubjectData/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import GeneralSubjectModel from "@/app/model/generalSubjectDataModel/schema";
import UserModel from "@/app/model/userDataModel/schema";
import UserSubscriptionModel from "@/app/model/userSubscriptionModel/schema";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";

// ✅ Firebase Admin is no longer needed for this route
// import admin from "@/app/utils/firebaseAdmin";
import AdminModel from "@/app/model/adminDataModel/schema";
import ClassModel from "@/app/model/classDataModel/schema";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return handleOptions();
}

export const GET = async () => {
  try {
    await connectdb();
    const headerList = await headers();
    const sessionToken = (headerList.get("authorization") || "").split("Bearer ")[1];

    let userHasActiveSubscription = false;

    // ✅ Check for an active subscription if a user session token is provided
    if (sessionToken) {
      // Find the user by their custom session token
      const user = await UserModel.findOne({ sessionToken: sessionToken });

      if (user) {
        const userSubDoc = await UserSubscriptionModel.findOne({ userId: user._id });
        if (userSubDoc) {
          userHasActiveSubscription = userSubDoc.subscriptions.some(
            (sub) => sub.status === 'active' && sub.expireDate > new Date()
          );
        }
      }
    }

    // ✅ Build the query based on subscription status
    let query = { isActive: true };
    if (!userHasActiveSubscription) {
      // If no active subscription, only show subjects marked as 'all'
      query.visibility = 'all';
    }
    // If they have a subscription, the query remains { isActive: true }, fetching all active subjects.

    const subjects = await GeneralSubjectModel.find(query)
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