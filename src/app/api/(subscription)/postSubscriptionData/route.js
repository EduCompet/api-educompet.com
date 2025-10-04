import { NextResponse } from "next/server";
import {connectdb} from "@/app/database/mongodb";
import SubscriptionModel from "@/app/model/subscriptionsDataModel/schema";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

// ✅ POST: Create new subscription
export const POST = async (req) => {
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
    const body = await req.json();

    const newSubscription = new SubscriptionModel(body);
    const savedSubscription = await newSubscription.save();

    return withCors(NextResponse.json(
      { success: true, data: savedSubscription },
      { status: 201 }
    ));
  } catch (error) {
    console.error("Error creating subscription:", error);
    return withCors(NextResponse.json(
      {
        success: false,
        message: error.message || "Internal Server Error",
      },
      { status: 500 }
    ));
  }
};
