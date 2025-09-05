import mongoose from 'mongoose';
import CounterModel from '../counterDataModel/schema.js'; // adjust path if needed

const { Schema, models, model } = mongoose;

const InvoiceSchema = new Schema(
  {
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
    },
    invoiceNumber: { type: String, unique: true }, // auto-generated (INVID001)
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['paid', 'unpaid', 'cancelled'],
      default: 'unpaid',
    },
    issuedAt: { type: Date, default: Date.now },
    dueDate: { type: Date, required: false },
  },
  { timestamps: true }
);

// 🔹 Pre-save hook for invoiceNumber auto-generation
InvoiceSchema.pre('save', async function (next) {
  if (this.isNew && !this.invoiceNumber) {
    try {
      const counter = await CounterModel.findOneAndUpdate(
        { name: 'invoiceNumber' },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
      );

      const sequenceNumber = counter.value.toString().padStart(3, '0');
      this.invoiceNumber = `INVID${sequenceNumber}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Prevent OverwriteModelError in dev/serverless
const InvoiceModel = models.Invoice || model('Invoice', InvoiceSchema);

export default InvoiceModel;
