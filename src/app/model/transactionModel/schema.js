import mongoose from 'mongoose';
import CounterModel from '../counterDataModel/schema.js'; // adjust path if needed

const { Schema, models, model } = mongoose;

const TransactionSchema = new Schema(
  {
    transactionId: { type: String, unique: true }, // auto-generated TRXID001
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String, required: false },
    razorpaySignature: { type: String, required: false },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      default: 'pending',
    },
    failureReason: { type: String, required: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } } // only createdAt
);

// 🔹 Pre-save hook for transactionId auto-generation
TransactionSchema.pre('save', async function (next) {
  if (this.isNew && !this.transactionId) {
    try {
      const counter = await CounterModel.findOneAndUpdate(
        { name: 'transactionId' },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
      );

      const sequenceNumber = counter.value.toString().padStart(3, '0');
      this.transactionId = `TRXID${sequenceNumber}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Prevent OverwriteModelError in hot reload/serverless
const TransactionModel =
  models.Transaction || model('Transaction', TransactionSchema);

export default TransactionModel;
