// src/app/model/userSubscriptionModel/schema.js
import mongoose from "mongoose";

const { Schema, models, model } = mongoose;

const UserSubscriptionItemSchema = new Schema(
  {
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
    },
    // ✅ FIX: Set classId to not be required
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: false },
    startDate: { type: Date, required: true },
    expireDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
    durationMonths: { type: Number, required: true },
    amountPaid: { type: Number, required: true },
    transaction_Id: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      required: false,
    },
  },
  { _id: false }
);

const UserSubscriptionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },
    subscriptions: [UserSubscriptionItemSchema],
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

UserSubscriptionSchema.index(
  { "subscriptions.status": 1, "subscriptions.expireDate": 1 },
  { partialFilterExpression: { "subscriptions.status": "active" } }
);

const UserSubscriptionModel =
  models.UserSubscription || model("UserSubscription", UserSubscriptionSchema);

export default UserSubscriptionModel;