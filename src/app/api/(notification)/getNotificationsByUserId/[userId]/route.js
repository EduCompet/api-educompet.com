// src/app/api/(notification)/getNotificationsByUserId/[userId]/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import NotificationModel from "@/app/model/notificationModel/schema";
import { withCors, handleOptions } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return handleOptions();
}

export const GET = async (req, { params }) => {
  // ✅ await params as required by Next.js
  const { userId } = await params;

  if (!userId) {
    return withCors(NextResponse.json({ message: "User ID is required" }, { status: 400 }));
  }

  try {
    await connectdb();
    const notifications = await NotificationModel.find({ userId }).sort({ createdAt: -1 }).lean();
    return withCors(NextResponse.json({ success: true, data: notifications }, { status: 200 }));
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return withCors(NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 }));
  }
};
