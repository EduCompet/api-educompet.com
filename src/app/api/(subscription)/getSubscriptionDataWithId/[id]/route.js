import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import SubscriptionModel from "@/app/model/subscriptionsDataModel/schema";
import { headers } from "next/headers";
import AdminModel from "@/app/model/adminDataModel/schema";
import ClassModel from "@/app/model/classDataModel/schema";
import { handleOptions, withCors } from "@/app/utils/cors";


export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

// ✅ GET: Fetch a single subscription by ID
export const GET = async (req, { params }) => {
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

    const { id } = params;

    const subscription = await SubscriptionModel.findById(id)
      .populate("classId", "name isActive")
      .populate("createdBy", "fullName email");

    if (!subscription) {
      return withCors(NextResponse.json(
        { success: false, message: "Subscription not found" },
        { status: 404 }
      ));
    }

    return withCors(NextResponse.json(
      { success: true, data: subscription },
      { status: 200 }
    ));
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return withCors(NextResponse.json(
      {
        success: false,
        message: error.message || "Internal Server Error",
      },
      { status: 500 }
    ));
  }
};
