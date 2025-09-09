import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectdb } from "@/app/database/mongodb";
import UserModel from "@/app/model/userDataModel/schema";
import TransactionModel from "@/app/model/transactionModel/schema";
import UserSubscriptionModel from "@/app/model/userSubscriptionModel/schema";
import { headers } from "next/headers";
import { withCors, handleOptions } from "@/app/utils/cors";
import admin from "@/app/utils/firebaseAdmin";


export const dynamic = "force-dynamic";

const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

export async function OPTIONS() {
  return handleOptions();
}

export const POST = async (req) => {
  const authToken = (await headers()).get("authorization")?.split("Bearer ")[1];

  if (!authToken) {
    return withCors(NextResponse.json({ success: false, message: "Unauthorized: No auth token provided." }, { status: 401 }));
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(authToken);
    const firebaseUid = decodedToken.uid;
    
    await connectdb();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      subscriptionPlanId,
      classId,
      durationMonths,
      amountPaid,
    } = await req.json();

    // 1. Verify the signature from Razorpay
    const sign = crypto
      .createHmac("sha256", razorpaySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (sign !== razorpay_signature) {
      return withCors(NextResponse.json({ success: false, message: "Invalid payment signature." }, { status: 400 }));
    }

    // 2. Find the user by their verified Firebase UID
    const user = await UserModel.findOne({ firebaseUid });
    if (!user) {
      return withCors(NextResponse.json({ success: false, message: "User not found." }, { status: 404 }));
    }

    // ✅ ================== NEW: SECURE CHECK ==================
    // 3. Check if the user already has an active subscription for this plan.
    const userSubDoc = await UserSubscriptionModel.findOne({ userId: user._id });
    if (userSubDoc) {
      const now = new Date();
      const hasActivePlan = userSubDoc.subscriptions.some(sub =>
        sub.subscriptionId.toString() === subscriptionPlanId &&
        sub.status === 'active' &&
        sub.expireDate > now
      );
      if (hasActivePlan) {
        return withCors(NextResponse.json(
          { success: false, message: "You already have an active subscription for this plan." },
          { status: 409 } // 409 Conflict is a good status code here
        ));
      }
    }
    // ✅ ================== END OF NEW CHECK ===================

    // 4. Create the transaction record
    await TransactionModel.create({
      userId: user._id,
      subscriptionId: subscriptionPlanId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      amount: amountPaid,
      status: 'success',
    });

    // 5. Activate the subscription
    const startDate = new Date();
    const expireDate = new Date(startDate);
    expireDate.setMonth(expireDate.getMonth() + durationMonths);

    await UserSubscriptionModel.findOneAndUpdate(
      { userId: user._id },
      {
        $push: {
          subscriptions: {
            subscriptionId: subscriptionPlanId,
            classId: classId,
            startDate: startDate,
            expireDate: expireDate,
            status: 'active',
            durationMonths: durationMonths,
            amountPaid: amountPaid,
          },
        },
      },
      { new: true, upsert: true }
    );

    return withCors(NextResponse.json({ success: true, message: "Subscription activated successfully." }, { status: 200 }));

  } catch (error) {
    console.error("Error in verify-and-activate:", error);
    if (error.code === 'auth/id-token-expired') {
        return withCors(NextResponse.json({ success: false, message: "Authentication token expired." }, { status: 401 }));
    }
    return withCors(NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 }));
  }
};