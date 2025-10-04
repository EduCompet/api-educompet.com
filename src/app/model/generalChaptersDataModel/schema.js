import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const MediaSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['pdf', 'video', 'image', 'link'],
      required: true,
    },
    url: { type: String, required: true },
    title: { type: String, required: false },
  },
  { _id: false } // no need for individual media _id
);

const GeneralChapterSchema = new Schema(
  {
    generalSubjectId: {
      type: Schema.Types.ObjectId,
      ref: 'GeneralSubject',
      required: true,
    }, // → generalSubjects._id
    name: { type: String, required: true },
    media: [MediaSchema], // array of media entries
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true }, // → admins._id
  },
  { timestamps: true }
);

// Prevent OverwriteModelError under HMR/serverless
const GeneralChapterModel =
  models.GeneralChapter || model('GeneralChapter', GeneralChapterSchema);

export default GeneralChapterModel;
