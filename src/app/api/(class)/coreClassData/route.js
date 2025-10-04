// src/app/api/(class)/coreClassData/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import ClassModel from "@/app/model/classDataModel/schema";
import { headers } from "next/headers";
// ✅ Import the missing AdminModel to fix the crash
import AdminModel from "@/app/model/adminDataModel/schema";
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const GET = async () => {
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

    // This query will now work correctly
    const classes = await ClassModel.find({ isActive: true })
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 })
      .lean();

    return withCors(NextResponse.json(
      {
        success: true,
        message: "All class data fetched successfully.",
        data: classes,
      },
      { status: 200 }
    ));
  } catch (error) {
    console.error("Error fetching class data:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};