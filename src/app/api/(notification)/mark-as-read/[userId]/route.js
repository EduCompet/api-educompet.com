// src/app/api/notifications/mark-as-read/[userId]/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import NotificationModel from "@/app/model/notificationModel/schema";
import { withCors, handleOptions } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return handleOptions();
}

export const PATCH = async (req, { params }) => {
  try {
        const { userId } = await params; 
    if (!userId) {
      return withCors(NextResponse.json({ message: "User ID is required" }, { status: 400 }));
    }

    await connectdb();

    await NotificationModel.updateMany(
      { userId: userId, isRead: false },
      { $set: { isRead: true } }
    );

    return withCors(NextResponse.json({ success: true, message: "Notifications marked as read" }, { status: 200 }));
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return withCors(NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 }));
  }
};