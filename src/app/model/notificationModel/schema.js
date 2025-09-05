// src/app/model/notificationModel/schema.js
import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const NotificationSchema = new Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    notificationType: {
      type: String,
      enum: ['Job_update', 'General', 'Reminder'],
      required: true,
    },
    contentId: { type: String, required: false },
    jobId: { type: String, required: false },
    sentAt: { type: Date, default: Date.now },
    // You might want to add a userId to target specific users
    // userId: { type: Schema.Types.ObjectId, ref: 'User', required: false }, 
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Prevent OverwriteModelError in dev
const NotificationModel = models.Notification || model('Notification', NotificationSchema);

export default NotificationModel;