// src/app/api/(users)/getUsersData/route.js
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

export const GET = async () => {
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

    const users = await UserModel.find()
      .select("-password -__v") // hide sensitive fields
      .lean();

    return withCors(NextResponse.json(
      {
        success: true,
        message: "Users fetched successfully.",
        data: users,
      },
      { status: 200 }
    ));
  } catch (error) {
    console.error("Error fetching users:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};
