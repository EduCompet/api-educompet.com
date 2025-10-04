// src/app/api/transactions/getAllTransactions/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import TransactionModel from "@/app/model/transactionModel/schema.js";
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;


export async function OPTIONS() {
  return handleOptions();
}

export const GET = async () => {
    const headerList =await headers();
    const reqApiKey = headerList.get("x-api-key");
     if (xkey !== reqApiKey) {
        return withCors(NextResponse.json(
          { success: false, message: "Invalid API Auth Key" },
          { status: 401 }
        ));
      }
  try {
    await connectdb();

    const transactions = await TransactionModel.find()
      .populate("userId", "fullName email")           // fetch user info
      .populate("subscriptionId", "name subscriptionId") // fetch subscription info
      .lean();

    return withCors(NextResponse.json(
      { success: true, message: "Transactions fetched successfully", data: transactions },
      { status: 200 }
    ));
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};
