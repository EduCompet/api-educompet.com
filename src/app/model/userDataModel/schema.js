// src/app/model/userDataModel/schema.js
import mongoose from 'mongoose';
import CounterModel from '../counterDataModel/schema';
import bcrypt from 'bcryptjs';

const { Schema, models, model } = mongoose;

const UserSchema = new Schema({
  // ✅ FIX: Removed the firebaseUid field entirely. This is the definitive fix for the E11000 error on signup.
  fullName:   { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true,trim: true, lowercase: true },
  password:   { type: String, required: false, trim: true },
  phone:      { type: String, unique: true, sparse: true, default: null, trim: true },
  dob:        { type: Date, required: false },
  studentID:    { type: String, unique: true, required: true },
  referralCode: { type: String, unique: true, required: true },
  referralId: { type: String, required: false, default: null, trim: true },
  photoUrl:  { type: String, required: false },
  fcmToken:  { type: String, required: false },
  lastLogin: { type: Date, default: Date.now },
  sessionToken: { type: String, required: false },
  theme: {type: String, enum: ['system', 'light', 'dark'], default: 'system'},
}, { timestamps: true });

UserSchema.pre('validate', async function (next) {
  if (this.isNew) {
    try {
      if (!this.studentID) {
        const counter = await CounterModel.findOneAndUpdate(
          { name: 'studentID' },
          { $inc: { value: 1 } },
          { new: true, upsert: true }
        );
        if (!counter) throw new Error('Could not create studentID counter.');
        this.studentID = `STUID${counter.value.toString().padStart(3, '0')}`;
      }

      if (!this.referralCode) {
        if (!this.fullName) throw new Error("Cannot generate referral code without fullName.");
        const namePart = this.fullName.substring(0, 3).toUpperCase();
        this.referralCode = `EC${namePart}${Math.floor(1000 + Math.random() * 9000)}`;
      }
      next();
    } catch (err) {
      return next(err);
    }
  } else {
    next();
  }
});

UserSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const UserModel = models.User || model('User', UserSchema);
export default UserModel;