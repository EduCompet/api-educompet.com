// app/api/getAdminDataWithEmail/route.js
import { NextResponse } from 'next/server';
import { connectdb } from "@/app/database/mongodb";
import AdminModel from '@/app/model/adminDataModel/schema';
import { headers } from 'next/headers';
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = 'force-dynamic';
const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const GET = async (req) => {
  const headerList = await headers();
  const reqApiKey = headerList.get("x-api-key");

if (xkey !== reqApiKey) {
    return withCors(NextResponse.json(
      { success: false, message: "Invalid API Auth Key" },
      { status: 401 }
    ));
}

  try {
    await connectdb();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    if (!email) {
      return withCors(NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      ));
    }
    // NOTE: Returns full admin doc (including password) to preserve current client behavior
    // Replace with a safer projection or server-side password verification later
    const admin = await AdminModel.findOne({ email }).select("-password").lean();
    if (!admin) {
      return withCors(NextResponse.json(
        { success: false, message: 'Admin not found' },
        { status: 404 }
      ));
    }
    return withCors(NextResponse.json({ success: true, data: admin }, { status: 200 }));
  } catch (error) {
    console.error('Error fetching admin data:', error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    ));
  }
}