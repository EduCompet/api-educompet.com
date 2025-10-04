// src/app/api/(users)/[id]/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import UserModel from "@/app/model/userDataModel/schema";
import { headers } from "next/headers";
import { withCors, handleOptions } from "@/app/utils/cors";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return handleOptions();
}

// UPDATE user details
export const PUT = async (req, { params }) => {
  // ✅ FIX: Using custom session token instead of Firebase token
  const sessionToken = (await headers()).get("authorization")?.split("Bearer ")[1];
  if (!sessionToken) {
    return withCors(NextResponse.json({ message: "Unauthorized" }, { status: 401 }));
  }

  try {
    const targetId = params.id; // This is the MongoDB _id from the URL
    
    await connectdb();
    
    // ✅ FIX: Find the authenticated user by their session token
    const user = await UserModel.findOne({ sessionToken: sessionToken });
    
    if (!user) {
        return withCors(NextResponse.json({ success: false, message: "Forbidden: Invalid session." }, { status: 403 }));
    }
    
    // ✅ FIX: Security check compares the authenticated user's _id with the target _id
    if (user._id.toString() !== targetId) {
        return withCors(NextResponse.json({ success: false, message: "Forbidden: You can only update your own profile." }, { status: 403 }));
    }

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return withCors(NextResponse.json({ success: false, message: "Invalid user ID." }, { status: 400 }));
    }

    const data = await req.json();
    const { phone, dob, referralId, photoUrl } = data;
    
    const updateData = {
        ...(phone && { phone }),
        ...(dob && { dob }),
        ...(referralId && { referralId }),
        ...(photoUrl && { photoUrl }),
    };

    if (Object.keys(updateData).length === 0) {
      return withCors(NextResponse.json({ success: false, message: "No fields to update provided." }, { status: 400 }));
    }
    
    const updatedUser = await UserModel.findByIdAndUpdate(
      targetId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return withCors(NextResponse.json({ success: false, message: "User not found." }, { status: 404 }));
    }

    return withCors(NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      data: updatedUser
    }, { status: 200 }));

  } catch (error) {
    let message = "An unexpected error occurred.";
    let statusCode = 500;

    if (error.code === 11000) {
        message = "This phone number is already registered with another account.";
        statusCode = 409;
    } else if (error.message) {
      message = error.message;
    }
    
    console.error("!!! Error in user update endpoint:", error);
    return withCors(NextResponse.json({ success: false, message }, { status: statusCode }));
  }
};