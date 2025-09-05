// src/app/api/payement/create-order/route.js
import { NextResponse } from "next/server";
import { razorpay } from "@/app/service/razorpay/route";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const POST = async (req) => {
  const headerList = await headers(); // ✅ Add await here
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
    const { amount, currency = "INR", receipt } = await req.json();

    if (!amount) {
      return withCors(
        NextResponse.json({ success: false, error: "Amount is required" }, { status: 400 })
      );
    }

    // Razorpay expects the amount in the smallest currency unit (e.g., paise for INR)
    const orderOptions = {
      amount: Math.round(amount), // Amount is already in paise from the Flutter app
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(orderOptions);

    return withCors(NextResponse.json(order, { status: 200 }));

  } catch (err) {
    console.error("create-order error:", err);
    return withCors(
      NextResponse.json({ success: false, error: "Order creation failed", errorDetails: err }, { status: 500 })
    );
  }
};