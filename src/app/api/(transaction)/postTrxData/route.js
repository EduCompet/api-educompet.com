// src/app/api/(transaction)/postTrxData/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import TransactionModel from "@/app/model/transactionModel/schema.js";
import UserModel from "@/app/model/userDataModel/schema.js"; // Import UserModel
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const POST = async (req) => {
  try {
    const headersList = await headers();
    const reqApiKey = headersList.get("x-api-key");

    if (xkey !== reqApiKey) {
      return withCors(NextResponse.json(
        { success: false, message: "Invalid API Auth Key" },
        { status: 401 }
      ));
    }

    await connectdb();

    const data = await req.json();
    const { firebaseUid, subscriptionId, razorpayOrderId, razorpayPaymentId, razorpaySignature, amount, currency, status, failureReason } = data;

    if (!firebaseUid || !subscriptionId || !razorpayOrderId || !amount) {
      return withCors(NextResponse.json(
        { success: false, message: "Required fields missing" },
        { status: 400 }
      ));
    }

    // Find the user by their Firebase UID to get the MongoDB ObjectId
    const user = await UserModel.findOne({ firebaseUid: firebaseUid });
    if (!user) {
      return withCors(NextResponse.json({ success: false, message: "User not found" }, { status: 404 }));
    }

    const newTransaction = await TransactionModel.create({
      userId: user._id, // Use the correct MongoDB ObjectId
      subscriptionId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      amount,
      currency: currency || "INR",
      status: status || "pending",
      failureReason: failureReason || "",
    });

    return withCors(NextResponse.json(
      { success: true, message: "Transaction created", data: newTransaction },
      { status: 201 }
    ));
  } catch (error) {
    console.error("Error creating transaction:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};