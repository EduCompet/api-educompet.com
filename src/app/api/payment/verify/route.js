// pages/api/payment/verify.js
import crypto from "crypto";
import { mongoClientPromise as clientPromise } from "@/app/database/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,            // ObjectId string of user (required)
      subscriptionId,    // subscription plan id (ObjectId string)
      classId,           // classId user bought access to
      pricingPlanIndex,  // index inside subscriptions.pricingPlans[] (optional)
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
      return res.status(400).json({ error: "missing razorpay fields" });

    if (!userId || !subscriptionId || !classId)
      return res.status(400).json({ error: "userId, subscriptionId, classId required" });

    // verify signature
    const sign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (sign !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // DB update
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);

    // Insert transaction
    const tx = {
      userId: new require("mongoose").Types.ObjectId(userId),
      subscriptionId: new require("mongoose").Types.ObjectId(subscriptionId),
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      amount: req.body.amount || null,
      currency: req.body.currency || "INR",
      status: "success",
      createdAt: new Date(),
    };
    await db.collection("transactions").insertOne(tx);

    // determine durationMonths from subscription pricingPlan if provided
    const sub = await db.collection("subscriptions").findOne({ _id: new require("mongodb").ObjectId(subscriptionId) });

    let durationMonths = null;
    if (sub && Array.isArray(sub.pricingPlans) && typeof pricingPlanIndex === "number") {
      const plan = sub.pricingPlans[pricingPlanIndex];
      if (plan && plan.durationMonths) durationMonths = plan.durationMonths;
    }

    // fallback: if frontend sends durationMonths directly
    if (!durationMonths && req.body.durationMonths) {
      durationMonths = Number(req.body.durationMonths);
    }

    // fallback default if still missing
    if (!durationMonths) durationMonths = 12; // default 12 months

    const startDate = new Date();
    const expireDate = new Date(startDate);
    expireDate.setMonth(expireDate.getMonth() + durationMonths);

    // Upsert userSubscriptions doc (one doc per user)
    const userSubsColl = db.collection("userSubscriptions");
    await userSubsColl.updateOne({ userId: new require("mongoose").Types.ObjectId(userId) },
      {
        $push: {
          subscriptions: {
            subscriptionId: new require("mongodb").ObjectId(subscriptionId),
            classId: new require("mongoose").Types.ObjectId(classId),
            startDate,
            expireDate,
            status: "active",
          },
        },
      },
      { upsert: true }
    );

    return res.status(200).json({ success: true, message: "Payment verified and subscription updated" });
  } catch (err) {
    console.error("verify err:", err);
    res.status(500).json({ error: err.message });
  }
}