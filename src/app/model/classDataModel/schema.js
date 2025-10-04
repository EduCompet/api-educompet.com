import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const ClassSchema = new Schema(
  {
    name: { type: String, required: true },        // e.g. "Class 10"
    isActive: { type: Boolean, default: true },    // default active
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true }, // link to admins._id
  },
  { timestamps: true }
);

// Prevent OverwriteModelError
const ClassModel = models.Class || model('Class', ClassSchema);

export default ClassModel;
