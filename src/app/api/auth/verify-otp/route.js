import { NextResponse } from 'next/server';
import { withCors, handleOptions } from '@/app/utils/cors';
import { otpStore } from '@/app/utils/otpStore';

export async function OPTIONS() {
  return handleOptions();
}

export const POST = async (req) => {
    try {
        const { email, otp } = await req.json();

        if (!email || !otp) {
            return withCors(NextResponse.json({ success: false, message: "Email and OTP are required." }, { status: 400 }));
        }

        const storedOtp = otpStore[email];

        if (!storedOtp) {
            return withCors(NextResponse.json({ success: false, message: "Invalid OTP." }, { status: 400 }));
        }

        if (storedOtp.otp !== otp) {
            return withCors(NextResponse.json({ success: false, message: "Invalid OTP." }, { status: 400 }));
        }

        if (Date.now() - storedOtp.timestamp > 10 * 60 * 1000) { // 10 minutes
            delete otpStore[email];
            return withCors(NextResponse.json({ success: false, message: "OTP has expired." }, { status: 400 }));
        }

        delete otpStore[email];

        return withCors(NextResponse.json({ success: true, message: "OTP verified successfully." }, { status: 200 }));

    } catch (error) {
        console.error("Error verifying OTP:", error);
        return withCors(NextResponse.json({ success: false, message: "An internal server error occurred." }, { status: 500 }));
    }
};