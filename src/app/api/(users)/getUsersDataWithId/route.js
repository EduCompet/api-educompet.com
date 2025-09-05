// src/app/api/(users)/getUsersDataWithId/route.js
import { NextResponse } from "next/server";
import {connectdb} from "@/app/database/mongodb";
import UserModel from "@/app/model/userDataModel/schema";
import { headers } from "next/headers";
import mongoose from "mongoose";
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const GET = async (req) => {
  const headerList = headers();
  const reqApiKey = headerList.get("x-api-key");

  if (xkey !== reqApiKey) {
    return NextResponse.json(
      { success: false, message: "Invalid API Auth Key" },
      { status: 401 }
    );
  }

  try {
    await connectdb();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("Id");

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return withCors(NextResponse.json(
        { success: false, message: "Valid userId is required." },
        { status: 400 }
      ));
    }

    const user = await UserModel.findById(userId).select("-password -__v").lean();

    if (!user) {
      return withCors(NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      ));
    }

    return withCors(NextResponse.json(
      {
        success: true,
        message: "User fetched successfully.",
        data: user,
      },
      { status: 200 }
    ));
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};
