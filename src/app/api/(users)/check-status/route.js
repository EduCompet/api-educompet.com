// src/app/api/(users)/check-status/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import UserModel from "@/app/model/userDataModel/schema";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";
import admin from "@/app/utils/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return handleOptions();
}

export const GET = async (req) => {
  // ✅ This line was missing 'await'
  const authToken = (await headers()).get("authorization")?.split("Bearer ")[1];

  if (!authToken) {
    return withCors(NextResponse.json({ message: "Unauthorized" }, { status: 401 }));
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(authToken);
    const { uid } = decodedToken;

    await connectdb();

    const user = await UserModel.findOne({ firebaseUid: uid }).lean();

    if (!user) {
      return withCors(NextResponse.json({
        success: true,
        userExists: false,
        hasCompletedProfile: false,
      }, { status: 200 }));
    }

    const hasCompletedProfile = user.phone && user.phone.trim().length > 0;

    return withCors(NextResponse.json({
      success: true,
      userExists: true,
      hasCompletedProfile: hasCompletedProfile,
    }, { status: 200 }));

  } catch (error) {
    console.error("Error checking user status:", error);
    if (error.code === 'auth/id-token-expired') {
        return withCors(NextResponse.json({ success: false, message: "Token expired" }, { status: 401 }));
    }
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};