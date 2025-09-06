// src/app/api/(transaction)/getTrxDataWithUserId/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import TransactionModel from "@/app/model/transactionModel/schema";
import UserModel from "@/app/model/userDataModel/schema"; // Import UserModel
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

  if (xkey !== reqApiKey) {
    return withCors(NextResponse.json(
      { success: false, message: "Invalid API Auth Key" },
      { status: 401 }
    ));
  }

  try {
    await connectdb();

    const { searchParams } = new URL(req.url);
    const firebaseUid = searchParams.get("userId"); // Now correctly named firebaseUid

    if (!firebaseUid) {
      return withCors(NextResponse.json(
        { success: false, message: "userId query param is required" },
        { status: 400 }
      ));
    }

    // First, find the user by their Firebase UID to get their MongoDB _id
    const user = await UserModel.findOne({ firebaseUid });

    if (!user) {
        return withCors(NextResponse.json({ success: false, message: "User not found" }, { status: 404 }));
    }

    // Then, use the user's _id to find transactions
    const transactions = await TransactionModel.find({ userId: user._id })
      .populate("subscriptionId", "name subscriptionId")
      .populate("userId", "fullName email")
      .sort({ createdAt: -1 }); // latest first

    if (!transactions || transactions.length === 0) {
      return withCors(NextResponse.json(
        { success: true, data: [], message: "No transactions found for this user" },
        { status: 200 }
      ));
    }

    return withCors(NextResponse.json(
      {
        success: true,
        message: "Transactions fetched successfully",
        data: transactions,
      },
      { status: 200 }
    ));
  } catch (error) {
    console.error("Error fetching transactions by user:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};