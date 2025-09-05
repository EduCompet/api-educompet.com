// src/app/api/(notification)/postNotificationData/route.js
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

export const POST = async (req) => {
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
    const body = await req.json();
    const { title, message, notificationType, contentId, jobId } = body;

    // Validation for required fields
    if (!title || !message || !notificationType) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: "title, message, and notificationType are required.",
          },
          { status: 400 }
        )
      );
    }

    // Create a new notification
    const newNotification = await NotificationModel.create({
      title,
      message,
      notificationType,
      contentId,
      jobId,
    });

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Notification created successfully.",
          data: newNotification,
        },
        { status: 201 }
      )
    );
  } catch (error) {
    console.error("Error creating notification:", error);
    return withCors(
      NextResponse.json(
        { success: false, message: error.message || "Internal Server Error" },
        { status: 500 }
      )
    );
  }
};
