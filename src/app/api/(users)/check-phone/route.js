// src/app/api/(users)/check-phone/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import UserModel from "@/app/model/userDataModel/schema";
import { withCors, handleOptions } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const POST = async (req) => {
  const reqApiKey = req.headers.get("x-api-key");

  if (xkey !== reqApiKey) {
    return withCors(
      NextResponse.json(
        { success: false, message: "Invalid API Auth Key" },
        { status: 401 }
      )
    );
  }

  try {
    await connectdb();
    const { phone } = await req.json();

    if (!phone) {
      return withCors(
        NextResponse.json(
          { success: false, message: "Phone number is required." },
          { status: 400 }
        )
      );
    }

    const existingUser = await UserModel.findOne({ phone: phone }).lean();

    if (existingUser) {
      return withCors(
        NextResponse.json(
          {
            success: true,
            exists: true,
            message: "Phone number is already registered.",
          },
          { status: 200 }
        )
      );
    }

    return withCors(
      NextResponse.json(
        { success: true, exists: false, message: "Phone number is available." },
        { status: 200 }
      )
    );
  } catch (error) {
    console.error("Error checking phone number:", error);
    return withCors(
      NextResponse.json(
        { success: false, message: "Internal Server Error" },
        { status: 500 }
      )
    );
  }
};