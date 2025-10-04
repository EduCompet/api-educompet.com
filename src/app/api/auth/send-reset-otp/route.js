import { NextResponse } from 'next/server';
import { connectdb } from '@/app/database/mongodb';
import UserModel from '@/app/model/userDataModel/schema';
import { withCors, handleOptions } from '@/app/utils/cors';
import { sendPasswordResetEmail } from '@/app/utils/email/email';
import { otpStore } from '@/app/utils/otpStore';

export async function OPTIONS() {
  return handleOptions();
}

export const POST = async (req) => {
    try {
        await connectdb();
        const { email } = await req.json();

        if (!email) {
            return withCors(NextResponse.json({ success: false, message: "Email is required." }, { status: 400 }));
        }

        const user = await UserModel.findOne({ email: email.toLowerCase() });
        // For password reset, the user MUST exist.
        if (!user) {
            return withCors(NextResponse.json({ success: false, message: "No account found with this email." }, { status: 404 }));
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        // Store the OTP with the user's email
        otpStore[email] = { otp, timestamp: Date.now() };

        // Use the new email function and template
        await sendPasswordResetEmail(email, otp);

        return withCors(NextResponse.json({ success: true, message: "Password reset OTP sent successfully." }, { status: 200 }));

    } catch (error) {
        console.error("Error sending password reset OTP:", error);
        return withCors(NextResponse.json({ success: false, message: "An internal server error occurred." }, { status: 500 }));
    }
};