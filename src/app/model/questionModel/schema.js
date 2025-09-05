import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const OptionSchema = new Schema(
  {
    optionText: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false } // don't need separate _id for options
);

const QuestionSchema = new Schema(
  {
    text: { type: String, required: true }, // question text
    options: { type: [OptionSchema], required: true }, // MCQ options
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: false },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: false },
    generalSubjectId: {
      type: Schema.Types.ObjectId,
      ref: 'GeneralSubject',
      required: false,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  },
  { timestamps: true }
);

// Prevent OverwriteModelError
const QuestionModel = models.Question || model('Question', QuestionSchema);

export default QuestionModel;
