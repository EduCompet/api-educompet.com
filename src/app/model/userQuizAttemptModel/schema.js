import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const AnswerSchema = new Schema(
  {
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    selectedOption: { type: String, required: true }, // optionText or optionId
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const UserQuizAttemptSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },

    score: { type: Number, required: true }, // number of correct answers
    totalQuestions: { type: Number, required: true },
    percentage: { type: Number, required: true }, // e.g., (score / totalQuestions) * 100

    status: {
      type: String,
      enum: ['passed', 'failed', 'in-progress'],
      required: true,
    },

    answers: { type: [AnswerSchema], required: true },

    attemptedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexes for leaderboard & analytics
UserQuizAttemptSchema.index({ quizId: 1, score: -1 }); // leaderboard ranking
UserQuizAttemptSchema.index({ userId: 1, quizId: 1 }); // user history per quiz

// Prevent OverwriteModelError
const UserQuizAttemptModel =
  models.UserQuizAttempt || model('UserQuizAttempt', UserQuizAttemptSchema);

export default UserQuizAttemptModel;
