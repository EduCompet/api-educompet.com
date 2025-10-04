import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const ReferralSchema = new Schema(
  {
    code: { type: String, required: true, unique: true }, // referral code like HARSHA10
    discountPercent: { type: Number, required: true }, // e.g., 10%
    maxUses: { type: Number, default: null }, // optional limit (null = unlimited)
    usedCount: { type: Number, default: 0 }, // track usage
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true }, // admin who created
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, required: false }, // expiry date
  },
  { timestamps: true } // auto-adds createdAt, updatedAt
);

// Index for quicker lookups
ReferralSchema.index({ code: 1 });
ReferralSchema.index({ isActive: 1, expiresAt: 1 });

// Prevent OverwriteModelError in dev/serverless
const ReferralModel = models.Referral || model('Referral', ReferralSchema);

export default ReferralModel;
