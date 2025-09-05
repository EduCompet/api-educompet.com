import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const CounterSchema = new Schema(
  {
    name: { type: String, required: true },       // e.g., "video_views"
    category: { type: String, required: true },   // e.g., "content"
    value: { type: Number, default: 0 },          // counter value
    // createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true }, // reference admin
  },
  { timestamps: true }
);

// Prevent OverwriteModelError during hot reload / serverless
const CounterModel = models.Counter || model('Counter', CounterSchema);

export default CounterModel;
