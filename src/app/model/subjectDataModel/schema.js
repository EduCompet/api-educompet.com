import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const SubjectSchema = new Schema(
  {
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true }, // link to classes._id
    name: { type: String, required: true }, // e.g. "Mathematics", "Physics"
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true }, // link to admins._id
    generalSubjectId: { type: Schema.Types.ObjectId, ref: 'GeneralSubject', required: false }, // optional taxonomy bridge
  },
  { timestamps: true }
);

// Prevent OverwriteModelError
const SubjectModel = models.Subject || model('Subject', SubjectSchema);

export default SubjectModel;
