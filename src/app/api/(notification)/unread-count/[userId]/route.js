// src/app/api/notifications/unread-count/[userId]/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import NotificationModel from "@/app/model/notificationModel/schema";
import { withCors, handleOptions } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return handleOptions();
}

export const GET = async (req, { params }) => {
  try {
    const { userId } = await params;
    if (!userId) {
      return withCors(NextResponse.json({ message: "User ID is required" }, { status: 400 }));
    }

    await connectdb();

    const unreadCount = await NotificationModel.countDocuments({
      userId: userId,
      isRead: false,
    });

    return withCors(NextResponse.json({ success: true, unreadCount }, { status: 200 }));
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    return withCors(NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 }));
  }
};