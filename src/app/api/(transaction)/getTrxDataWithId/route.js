// src/app/api/(transaction)/getTransactionByTransactionId/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import TransactionModel from "@/app/model/transactionModel/schema";
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
    const transactionId = searchParams.get("transactionId"); // e.g., TRXID001

    if (!transactionId) {
      return withCors(NextResponse.json(
        { success: false, message: "transactionId query param is required" },
        { status: 400 }
      ));
    }

    const transaction = await TransactionModel.findOne({ transactionId })
      .populate("userId", "fullName email")
      .populate("subscriptionId", "name subscriptionId");

    if (!transaction) {
      return withCors(NextResponse.json(
        { success: false, message: "Transaction not found" },
        { status: 404 }
      ));
    }

    return withCors(NextResponse.json(
      { success: true, message: "Transaction fetched successfully", data: transaction },
      { status: 200 }
    ));
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};
