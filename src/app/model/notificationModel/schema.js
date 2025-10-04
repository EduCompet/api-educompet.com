// src/app/model/notificationModel/schema.js
import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false }, // target user
    title: { type: String, required: true },
    message: { type: String, required: true },
    notificationType: {
      type: String,
      enum: ['Job_update', 'General', 'Reminder'],
      required: true,
      default: 'General'
    },
    // optional extra linking fields
        entityId: { type: String, required: false }, // Use this for linking to a Job, etc.
    contentId: { type: String, required: false },
    jobId: { type: String, required: false },
    isRead: { type: Boolean, default: false },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Prevent OverwriteModelError in dev
const NotificationModel = models.Notification || model('Notification', NotificationSchema);

export default NotificationModel;
