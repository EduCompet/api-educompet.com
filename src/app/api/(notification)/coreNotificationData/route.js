// src/app/api/(notification)/coreNotificationData/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import NotificationModel from "@/app/model/notificationModel/schema";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const GET = async (req) => {
  const headerList = await headers();
  const reqApiKey = headerList.get("x-api-key");

  // API Key validation
  if (xkey !== reqApiKey) {
    return withCors(
      NextResponse.json(
        { success: false, message: "Invalid API Auth Key" },
        { status: 401 }
      )
    );
  }

  try {
    await connectdb();

    // Fetch all notifications, sorted by most recent
    const notifications = await NotificationModel.find({}).sort({ sentAt: -1 }).lean();

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Notifications fetched successfully.",
          data: notifications,
        },
        { status: 200 }
      )
    );
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return withCors(
      NextResponse.json(
        { success: false, message: error.message || "Internal Server Error" },
        { status: 500 }
      )
    );
  }
};
