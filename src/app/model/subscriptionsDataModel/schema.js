// app/model/subscriptionsDataModel/schema.js
import mongoose from 'mongoose';
import CounterModel from '../counterDataModel/schema';

const { Schema, models, model } = mongoose;

const PricingPlanSchema = new Schema(
  {
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    gstPercent: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    durationMonths: { type: Number, required: true },
    type: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
      required: true,
    },
  },
  { _id: false }
);

const SubscriptionSchema = new Schema(
  {
    subscriptionId: { type: String, required: false, unique: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: false }, 
    name: { type: String, required: true }, 
    description: { type: String, required: false },
    isActive: { type: Boolean, default: true },
    isUniversal: { type: Boolean, default: false }, // New field for the All-Access Pass
    isJobUpdate: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    pricingPlans: { type: [PricingPlanSchema], required: true },
  },
  { timestamps: true }
);

SubscriptionSchema.pre('save', async function (next) {
  if (this.isNew && !this.subscriptionId) {
    try {
      const counter = await CounterModel.findOneAndUpdate(
        { name: 'subscriptionId' },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
      );
      const sequenceNumber = counter.value.toString().padStart(3, '0');
      this.subscriptionId = `SUBCRID${sequenceNumber}`;
    } catch (err) {
      return next(err);
    }
  }
  // Ensure classId is null if the plan is universal
  if (this.isUniversal) {
      this.classId = undefined;
  }
  next();
});

const SubscriptionModel =
  models.Subscription || model('Subscription', SubscriptionSchema);

export default SubscriptionModel;