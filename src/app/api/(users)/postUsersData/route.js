// src/app/api/(users)/postUsersData/route.js
import { NextResponse } from "next/server";
import {connectdb} from "@/app/database/mongodb";
import UserModel from "@/app/model/userDataModel/schema";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const POST = async (req) => {
  const headerList =await headers();
  const reqApiKey = headerList.get("x-api-key");

  if (xkey !== reqApiKey) {
    return withCors(NextResponse.json(
      { success: false, message: "Invalid API Auth Key" },
      { status: 401 }
    ));
  }

  try {
    await connectdb();
    const data = await req.json();

    const { fullName, email } = data;

    if (!fullName || !email) {
      return withCors(NextResponse.json(
        { success: false, message: "fullName and email are required." },
        { status: 400 }
      ));
    }

    // Create user → pre-save hook will auto-generate studentId + referralCode
    const newUser = await UserModel.create(data);

    return withCors(NextResponse.json(
      {
        success: true,
        message: "User created successfully.",
        data: newUser,
      },
      { status: 201 }
    ));
  } catch (error) {
    console.error("Error creating user:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};
