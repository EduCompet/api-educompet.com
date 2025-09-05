// src/app/model/userSubscriptionModel/schema.js
import mongoose from "mongoose";

const { Schema, models, model } = mongoose;

const UserSubscriptionItemSchema = new Schema(
  {
    subscriptionId: {
      type:String,
    },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    startDate: { type: Date, required: true },
    expireDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
  },
  { _id: false } // array items don’t need their own _id
);

const UserSubscriptionSchema = new Schema(
  {
    userId: {
      type: String, // Changed from ObjectId
      unique: true,
      required: true,
    }, // one doc per user
    subscriptions: [UserSubscriptionItemSchema],
  },
  { timestamps: { createdAt: true, updatedAt: true } } // auto-manages updatedAt
);

// ✅ Indexes
UserSubscriptionSchema.index({ userId: 1 }, { unique: true }); // one doc per user
UserSubscriptionSchema.index(
  { "subscriptions.status": 1, "subscriptions.expireDate": 1 },
  { partialFilterExpression: { "subscriptions.status": "active" } }
); // for expiry queries

// Prevent OverwriteModelError
const UserSubscriptionModel =
  models.UserSubscription || model("UserSubscription", UserSubscriptionSchema);

export default UserSubscriptionModel;