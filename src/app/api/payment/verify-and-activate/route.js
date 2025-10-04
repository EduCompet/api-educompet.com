// src/app/api/payment/verify-and-activate/route.js
import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectdb } from "@/app/database/mongodb";
import UserModel from "@/app/model/userDataModel/schema";
import TransactionModel from "@/app/model/transactionModel/schema";
import UserSubscriptionModel from "@/app/model/userSubscriptionModel/schema";
import { headers } from "next/headers";
import { withCors, handleOptions } from "@/app/utils/cors";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

export async function OPTIONS() {
  return handleOptions();
}

export const POST = async (req) => {
  try {
    await connectdb();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      subscriptionPlanId,
      classId,
      durationMonths,
      amountPaid,
    } = await req.json();

    const sign = crypto
      .createHmac("sha256", razorpaySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (sign !== razorpay_signature) {
      return withCors(NextResponse.json({ success: false, message: "Invalid payment signature." }, { status: 400 }));
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return withCors(NextResponse.json({ success: false, message: "Valid user ID is required." }, { status: 400 }));
    }
    const user = await UserModel.findById(userId);
    if (!user) {
      return withCors(NextResponse.json({ success: false, message: "User not found." }, { status: 404 }));
    }

    const newTransaction = await TransactionModel.create({
      userId: user._id,
      subscriptionId: subscriptionPlanId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      amount: amountPaid,
      status: 'success',
    });

    const startDate = new Date();
    const expireDate = new Date(startDate);
    expireDate.setMonth(expireDate.getMonth() + durationMonths);

    // ✅ FIX: Build the subscription object conditionally
    const newSubscription = {
      subscriptionId: subscriptionPlanId,
      startDate: startDate,
      expireDate: expireDate,
      status: 'active',
      durationMonths: durationMonths,
      amountPaid: amountPaid,
      transaction_Id: newTransaction._id,
    };

    // Only add classId if it's a valid ObjectId
    if (classId && mongoose.Types.ObjectId.isValid(classId)) {
      newSubscription.classId = classId;
    }

    await UserSubscriptionModel.findOneAndUpdate(
      { userId: user._id },
      { $push: { subscriptions: newSubscription } },
      { new: true, upsert: true }
    );

 try {
        const plan = await SubscriptionModel.findById(subscriptionPlanId).populate('classId');
        if (plan) {
            await sendSubscriptionConfirmationEmail(user.email, {
                userName: user.fullName,
                planName: plan.name,
                className: plan.isUniversal ? 'All Access' : plan.classId?.name || 'N/A',
                expiryDate: expireDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
                orderId: razorpay_order_id,
            });
        }
    } catch (emailError) {
        console.error("Failed to send subscription confirmation email:", emailError);
        // Do not block the main response for this
    }

    return withCors(NextResponse.json({ success: true, message: "Subscription activated successfully." }, { status: 200 }));

  } catch (error) {
    console.error("Error in verify-and-activate:", error);
    return withCors(NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 }));
  }
};