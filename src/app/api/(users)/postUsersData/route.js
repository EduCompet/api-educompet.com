// src/app/api/(users)/postUsersData/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import UserModel from "@/app/model/userDataModel/schema";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";
import mongoose from "mongoose";
import UserSubscriptionModel from "@/app/model/userSubscriptionModel/schema";

export const dynamic = "force-dynamic";
const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() { return handleOptions(); }

export const POST = async (req) => {
  const headerList = await headers();
  const reqApiKey = headerList.get("x-api-key");
  if (xkey !== reqApiKey) {
    return withCors(NextResponse.json({ success: false, message: "Invalid API Auth Key" }, { status: 401 }));
  }

  let session;
  try {
    await connectdb();
    session = await mongoose.startSession();
    session.startTransaction();

    const data = await req.json();
    const { fullName, email, password, phone, dob, referralId } = data;

    if (!fullName || !email || !password) {
      await session.abortTransaction();
      return withCors(NextResponse.json({ success: false, message: "fullName, email, and password are required." }, { status: 400 }));
    }

    const existingUser = await UserModel.findOne({ email: email.toLowerCase() }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      return withCors(NextResponse.json({ success: false, message: "This email is already registered. Please try logging in." }, { status: 409 }));
    }

    // ✅ FIX: The user payload is now clean and does not contain any reference to firebaseUid.
    const newUserPayload = {
      fullName,
      email: email.toLowerCase(),
      password,
      phone,
      dob,
      referralId
    };

    const newUser = new UserModel(newUserPayload);
    await newUser.save({ session });

    await UserSubscriptionModel.create([{ userId: newUser._id, subscriptions: [] }], { session });
    await session.commitTransaction();

    const userResponse = newUser.toObject();
    delete userResponse.password;

    return withCors(NextResponse.json({
        success: true,
        message: "User created successfully. Please log in.",
        data: { user: userResponse },
      }, { status: 201 })
    );

  } catch (error) {
    if (session) await session.abortTransaction();
    console.error("Error creating user:", error);
    let message = "An unexpected error occurred.";
    let statusCode = 500;
    if (error.code === 11000) {
      message = `A user with this ${Object.keys(error.keyValue)[0]} already exists.`;
      statusCode = 409;
    } else {
      message = error.message || "Internal Server Error";
    }
    return withCors(NextResponse.json({ success: false, message: message }, { status: statusCode }));
  } finally {
    if (session) session.endSession();
  }
};