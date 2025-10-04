import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const GeneralSubjectSchema = new Schema(
  {
    name: { type: String, required: true }, // e.g. "Soft Skills", "Aptitude"
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true }, // linked to admins._id
    visibility: {
      type: String,
      enum: ['all', 'whitelist'],
      default: 'all',
    },
    allowedClassIds: [{ type: Schema.Types.ObjectId, ref: 'Class' }], // used if whitelist
  },
  { timestamps: true }
);

// Prevent OverwriteModelError
const GeneralSubjectModel =
  models.GeneralSubject || model('GeneralSubject', GeneralSubjectSchema);

export default GeneralSubjectModel;
