import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import GeneralSubjectModel from "@/app/model/generalSubjectDataModel/schema";
import UserModel from "@/app/model/userDataModel/schema";
import UserSubscriptionModel from "@/app/model/userSubscriptionModel/schema";
import admin from "@/app/utils/firebaseAdmin";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";

// ✅ Import all necessary models
import AdminModel from "@/app/model/adminDataModel/schema";
import ClassModel from "@/app/model/classDataModel/schema";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return handleOptions();
}

export const GET = async () => {
  try {
    await connectdb();
    const authToken = (headers().get("authorization") || "").split("Bearer ")[1];

    let userHasActiveSubscription = false;

    // ✅ Check for an active subscription if a user is logged in
    if (authToken) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(authToken);
        const user = await UserModel.findOne({ firebaseUid: decodedToken.uid });

        if (user) {
          const userSubDoc = await UserSubscriptionModel.findOne({ userId: user._id });
          if (userSubDoc) {
            userHasActiveSubscription = userSubDoc.subscriptions.some(
              (sub) => sub.status === 'active' && sub.expireDate > new Date()
            );
          }
        }
      } catch (error) {
        // Token is invalid or expired, treat as a non-subscriber
        console.warn("Auth token validation failed:", error.message);
      }
    }

    // ✅ Build the query based on subscription status
    let query = { isActive: true };
    if (!userHasActiveSubscription) {
      // If no active subscription, only show subjects marked as 'all'
      query.visibility = 'all';
    }
    // If they have a subscription, the query remains { isActive: true }, fetching all subjects.

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