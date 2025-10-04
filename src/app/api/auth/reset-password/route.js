import { NextResponse } from 'next/server';
import { connectdb } from '@/app/database/mongodb';
import UserModel from '@/app/model/userDataModel/schema';
import { withCors, handleOptions } from '@/app/utils/cors';

export async function OPTIONS() {
  return handleOptions();
}

export const POST = async (req) => {
    try {
        await connectdb();
        const { email, password } = await req.json();

        if (!email || !password) {
            return withCors(NextResponse.json({ success: false, message: "Email and password are required." }, { status: 400 }));
        }

        const user = await UserModel.findOne({ email: email.toLowerCase() });
        if (!user) {
            return withCors(NextResponse.json({ success: false, message: "User not found." }, { status: 404 }));
        }

        user.password = password;
        await user.save();

        return withCors(NextResponse.json({ success: true, message: "Password reset successfully." }, { status: 200 }));

    } catch (error) {
        console.error("Error resetting password:", error);
        return withCors(NextResponse.json({ success: false, message: "An internal server error occurred." }, { status: 500 }));
    }
};