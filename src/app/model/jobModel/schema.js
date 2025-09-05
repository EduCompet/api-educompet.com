import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const JobSchema = new Schema(
  {
    title: { type: String, required: true },
    organization: { type: String, required: true },
    shortDescription: { type: String, required: true, maxlength: 250 }, // preview text
    description: { type: String, required: true }, // full job description
    applyLink: { type: String, required: true }, // external job/apply link
    deadline: { type: Date, required: true }, // last date to apply
    postedAt: { type: Date, default: Date.now }, // job posted date
    qualification: { type: String, required: false }, // e.g., "B.Sc, B.Tech"
    vacancy: { type: Number, default: 1 }, // number of openings
    category: { type: String, required: false }, // e.g., "IT", "Management"
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true }, // admin who posted
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index for faster filtering/searching
JobSchema.index({ deadline: 1, category: 1 });
JobSchema.index({ title: 'text', organization: 'text', description: 'text' }); // full-text search

// Prevent OverwriteModelError in dev
const JobModel = models.Job || model('Job', JobSchema);

export default JobModel;
