// src/app/api/(users)/loginOrSignUp/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import UserModel from "@/app/model/userDataModel/schema";
import UserSubscriptionModel from "@/app/model/userSubscriptionModel/schema";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";
import admin from "@/app/utils/firebaseAdmin";

export const dynamic = "force-dynamic";
const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const POST = async (req) => {
  const headerList = await headers();
  const reqApiKey = headerList.get("x-api-key");

  if (xkey !== reqApiKey) {
    return withCors(
      NextResponse.json(
        {
          success: false,
          message: "Invalid API Auth Key",
        },
        { status: 401 }
      )
    );
  }

  try {
    await connectdb();
    const data = await req.json();
    const {
      firebaseUid,
      email,
      fullName,
      photoUrl,
      dob,
      phone,
      referralCode,
      fcmToken,
    } = data;

    if (!firebaseUid || !email) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: "Firebase UID and email are required.",
          },
          { status: 400 }
        )
      );
    }

    let existingUser = await UserModel.findOne({ firebaseUid: firebaseUid });

    if (existingUser) {
      const oldFcmToken = existingUser.fcmToken;
      // If there's a new token and it's different from the old one, send a logout notification
      if (fcmToken && oldFcmToken && oldFcmToken !== fcmToken) {
        const message = {
          token: oldFcmToken,
          data: {
            type: "LOGOUT",
            message: "You have been logged out because you signed in on another device.",
          },
        };
        try {
          console.log(`Sending logout notification to token: ${oldFcmToken}`);
          await admin.messaging().send(message);
        } catch (error) {
          console.error("Failed to send logout notification:", error.message);
          // Important: Don't block the login if sending the notification fails
        }
      }

      const updateData = {
        lastLogin: new Date(),
        ...(fullName && { fullName }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(photoUrl && { photoUrl }),
        ...(dob && { dob }),
        ...(fcmToken && { fcmToken }),
      };

      const updatedUser = await UserModel.findOneAndUpdate(
        { firebaseUid: firebaseUid },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      return withCors(
        NextResponse.json(
          {
            success: true,
            message: "User details updated successfully.",
            data: updatedUser,
            isNewUser: false,
          },
          { status: 200 }
        )
      );
    }

    const newUser = await UserModel.create({
      firebaseUid,
      email,
      fullName,
      photoUrl,
      dob,
      phone,
      referralCode,
      fcmToken,
    });

    // Create an empty user subscription document
    await UserSubscriptionModel.create({
      userId: newUser._id,
      subscriptions: [],
    });


    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "User created successfully.",
          data: newUser,
          isNewUser: true,
        },
        { status: 201 }
      )
    );
  } catch (error) {
    let message = "Internal Server Error";
    let statusCode = 500;

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      message = `A user with this ${duplicateField} already exists.`;
      statusCode = 409;
    } else if (error.message) {
      message = error.message;
    }

    console.error("Error in loginOrSignUp:", error);
    return withCors(
      NextResponse.json(
        {
          success: false,
          message,
        },
        { status: statusCode }
      )
    );
  }
};