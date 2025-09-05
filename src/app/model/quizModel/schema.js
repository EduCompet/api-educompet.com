import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const QuizSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: false },

    // Scope
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: false },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: false },
    generalSubjectId: {
      type: Schema.Types.ObjectId,
      ref: 'GeneralSubject',
      required: false,
    },

    // Quiz Content
    questionIds: [
      { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    ],

    timeLimit: { type: Number, required: true }, // seconds
    totalMarks: { type: Number, required: true },
    isActive: { type: Boolean, default: true },

    // Metadata
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } } // keep createdAt only
);

// 🔹 Validation: enforce quiz scope
QuizSchema.pre('validate', function (next) {
  if (this.generalSubjectId) {
    // Universal quiz → generalSubjectId only
    this.classId = undefined;
    this.subjectId = undefined;
  } else {
    // Class-scoped quiz → must have both classId & subjectId
    if (!this.classId || !this.subjectId) {
      return next(
        new Error(
          'Quiz must either target a General Subject OR both Class & Subject.'
        )
      );
    }
  }
  next();
});

// Prevent OverwriteModelError
const QuizModel = models.Quiz || model('Quiz', QuizSchema);

export default QuizModel;
