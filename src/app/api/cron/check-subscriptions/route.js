// src/app/api/cron/check-subscriptions/route.js
import { NextResponse } from 'next/server';
import { connectdb } from '@/app/database/mongodb';
import UserSubscriptionModel from '@/app/model/userSubscriptionModel/schema';
import UserModel from '@/app/model/userDataModel/schema';
import SubscriptionModel from '@/app/model/subscriptionsDataModel/schema';
import { sendSubscriptionReminderEmail, sendSubscriptionExpiredEmail } from '@/app/utils/email/email';

export const GET = async (req) => {
    // Secure this endpoint with a secret cron job key
    const cronSecret = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        await connectdb();
        const today = new Date();
        
        // --- 1. Find subscriptions expiring in exactly 7 days for reminders ---
        const reminderDate = new Date(today);
        reminderDate.setDate(today.getDate() + 7);
        
        const expiringSubs = await UserSubscriptionModel.find({
            "subscriptions.status": "active",
            "subscriptions.expireDate": {
                $gte: new Date(reminderDate.setHours(0, 0, 0, 0)),
                $lt: new Date(reminderDate.setHours(23, 59, 59, 999)),
            }
        }).populate('userId', 'fullName email').populate('subscriptions.subscriptionId', 'name');

        for (const userSubDoc of expiringSubs) {
            for (const sub of userSubDoc.subscriptions) {
                if (sub.status === 'active' && sub.expireDate.toISOString().slice(0,10) === reminderDate.toISOString().slice(0,10)) {
                    await sendSubscriptionReminderEmail(userSubDoc.userId.email, {
                        userName: userSubDoc.userId.fullName,
                        planName: sub.subscriptionId.name,
                        daysLeft: '7',
                        expiryDate: sub.expireDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
                    });
                }
            }
        }

        // --- 2. Find subscriptions that expired 3 days ago ---
        const expiredDate = new Date(today);
        expiredDate.setDate(today.getDate() - 3);

        const expiredSubs = await UserSubscriptionModel.find({
            "subscriptions.status": "active", // We find 'active' ones that have passed their expiry date to update them
            "subscriptions.expireDate": {
                $gte: new Date(expiredDate.setHours(0, 0, 0, 0)),
                $lt: new Date(expiredDate.setHours(23, 59, 59, 999)),
            }
        }).populate('userId', 'fullName email').populate('subscriptions.subscriptionId', 'name');

        for (const userSubDoc of expiredSubs) {
             for (const sub of userSubDoc.subscriptions) {
                if (sub.expireDate.toISOString().slice(0,10) === expiredDate.toISOString().slice(0,10)) {
                    // Send "we miss you" email
                    await sendSubscriptionExpiredEmail(userSubDoc.userId.email, {
                        userName: userSubDoc.userId.fullName,
                        planName: sub.subscriptionId.name,
                    });
                    // Mark the subscription as expired in the DB
                    sub.status = 'expired';
                }
            }
            await userSubDoc.save();
        }

        return NextResponse.json({ success: true, message: 'Subscription check completed.' });

    } catch (error) {
        console.error("Cron job error:", error);
        return NextResponse.json({ success: false, message: 'Cron job failed.' }, { status: 500 });
    }
};