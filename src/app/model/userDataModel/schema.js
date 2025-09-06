// src/app/model/userDataModel/schema.js

import mongoose from 'mongoose';
import CounterModel from '../counterDataModel/schema';

const { Schema, models, model } = mongoose;

const UserSchema = new Schema({
  googleId: { type: String, required: false },
  firebaseUid: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: false, unique: true, sparse: true },
  password: { type: String, required: false },
  dob: { type: Date, required: false },
  // ✅ Make sure studentId is properly configured
  studentId: { type: String, unique: true, sparse: true },
  school: { type: String, required: false },
  photoUrl: { type: String, required: false },
  fcmToken: { type: String, required: false },
  referralId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  referralCode: { type: String, unique: true, sparse: true },
  isLegalAccept: { type: Boolean, default: false },
  isTerminated: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
}, { timestamps: true });

// ✅ Enhanced pre-save hook with better error handling
UserSchema.pre('save', async function (next) {
  // Only generate IDs for new documents that don't already have them
  if (this.isNew) {
    try {
      // Generate studentId if not provided
      if (!this.studentId) {
        const counter = await CounterModel.findOneAndUpdate(
          { name: 'studentId' },
          { $inc: { value: 1 } },
          { new: true, upsert: true }
        );

        if (!counter) {
          throw new Error('Could not retrieve or create the studentId counter.');
        }

        const sequenceNumber = counter.value.toString().padStart(3, '0');
        this.studentId = `STUID${sequenceNumber}`;
      }

      // Generate referralCode if not provided
      if (!this.referralCode && this.fullName) {
        const prefix = 'EC';
        const namePart = this.fullName.substring(0, 3).toUpperCase();
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        this.referralCode = `${prefix}${namePart}${randomNum}`;
      }
    } catch (err) {
      console.error("Error in pre-save hook:", err);
      return next(err);
    }
  }
  next();
});

const UserModel = models.User || model('User', UserSchema);
export default UserModel;
