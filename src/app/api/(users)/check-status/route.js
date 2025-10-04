// src/app/api/check-status/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import UserModel from "@/app/model/userDataModel/schema";
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
    return withCors(NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 }));
  }

  try {
    await connectdb();

    // ✅ FIX: Find user by sessionToken
    const user = await UserModel.findOne({ sessionToken: sessionToken }).lean();

    if (!user) {
      return withCors(NextResponse.json({
        success: false, // User not found with this token
        message: "Invalid session.",
        userExists: false,
        hasCompletedProfile: false,
      }, { status: 401 }));
    }

    const hasCompletedProfile = user.phone && user.phone.trim().length > 0;

    return withCors(NextResponse.json({
      success: true,
      userExists: true,
      hasCompletedProfile: hasCompletedProfile,
    }, { status: 200 }));

  } catch (error) {
    console.error("Error checking user status:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};