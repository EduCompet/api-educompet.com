import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import UserModel from "@/app/model/userDataModel/schema";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";

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