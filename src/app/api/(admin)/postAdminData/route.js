// src/app/api/(admin)/postAdminData/route.js
import { NextResponse } from "next/server";
import connectdb from "@/app/database/mongodb";
import AdminModel from "@/app/model/adminDataModel/schema";
import { headers } from "next/headers";
import mongoose from "mongoose";
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const POST = async (req) => {
  const headerList = headers();
  const reqApiKey = headerList.get("x-api-key");

  if (xkey !== reqApiKey) {
    return withCors(NextResponse.json(
      { success: false, message: "Invalid API Auth Key" },
      { status: 401 }
    ));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await connectdb();
    const data = await req.json();
    const { fullName, email, password, phone } = data;

    if (!fullName || !email || !password) {
      throw new Error("fullName, email, and password are required.");
    }

    // check if admin already exists
    const existingAdmin = await AdminModel.findOne({ email }).session(session);
    if (existingAdmin) {
      throw new Error("Admin with this email already exists.");
    }

    // create new admin
    const newAdmin = await AdminModel.create(
      [
        {
          fullName,
          email,
          password, // ⚠️ ideally hash before saving
          phone,
          isActive: true,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return withCors(NextResponse.json(
      {
        success: true,
        message: "Admin created successfully.",
        data: newAdmin[0],
      },
      { status: 201 }
    ));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating admin:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};
