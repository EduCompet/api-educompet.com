import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import SubscriptionModel from "@/app/model/subscriptionsDataModel/schema";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";
import ClassModel from "@/app/model/classDataModel/schema"; // Import ClassModel
import AdminModel from "@/app/model/adminDataModel/schema"; // Import AdminModel


export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

// ✅ GET: Fetch all subscriptions with populated class + admin
export const GET = async () => {
  const headerList =await headers();
  const reqApiKey = headerList.get("x-api-key");

  // 🔑 API Key validation
  if (xkey !== reqApiKey) {
    return withCors(NextResponse.json(
      { success: false, message: "Invalid API Auth Key" },
      { status: 401 }
    ));
  }

  try {
    await connectdb();

    const subscriptions = await SubscriptionModel.find()
      .populate("classId", "name isActive") // show class details
      .populate("createdBy", "fullName email"); // show admin details

    return withCors(NextResponse.json(
      { success: true, data: subscriptions },
      { status: 200 }
    ));
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return withCors(NextResponse.json(
      {
        success: false,
        message: error.message || "Internal Server Error",
      },
      { status: 500 }
    ));
  }
};