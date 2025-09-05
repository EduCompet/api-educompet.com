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
  { _id: false } // don’t need separate _id for each media object
);

const ChapterSchema = new Schema(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true }, // → subjects._id
    name: { type: String, required: true },
    media: [MediaSchema], // array of media objects
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true }, // → admins._id
  },
  { timestamps: true }
);

// Prevent OverwriteModelError
const ChapterModel = models.Chapter || model('Chapter', ChapterSchema);

export default ChapterModel;
