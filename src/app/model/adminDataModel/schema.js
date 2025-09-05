import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const AdminSchema = new Schema(
  {
    googleId: { type: String, required: false }, // optional if you allow manual signup
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: false, unique: true },
    password: { type: String, required: false }, // hashed password if not using googleId
    // role: {
    //   type: String,
    //   enum: ['superAdmin', 'admin', 'moderator'],
    //   default: 'admin',
    //   required: true,
    // },
    lastLogin: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true } // adds createdAt & updatedAt automatically
);

// Prevent OverwriteModelError in dev/hot reload
const AdminModel = models.Admin || model('Admin', AdminSchema);

export default AdminModel;
