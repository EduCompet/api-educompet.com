// src/app/api/(class)/postClassData/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import ClassModel from "@/app/model/classDataModel/schema"
import { headers } from "next/headers";
import mongoose from "mongoose";
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
    return withCors(NextResponse.json(
      { success: false, message: "Invalid API Auth Key" },
      { status: 401 }
    ));
  }



  try {
    await connectdb();
    const session = await mongoose.startSession();
    session.startTransaction();
    const data = await req.json();
    const { name, createdBy, isActive } = data;

    if (!name || !createdBy) {
      throw new Error("Class name and createdBy are required.");
    }

    const newClass = await ClassModel.create(
      [
        {
          name,
          createdBy,
          isActive: isActive ?? true, // default true if not provided
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return withCors(NextResponse.json(
      {
        success: true,
        message: "Class created successfully.",
        data: newClass[0],
      },
      { status: 201 }
    ));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating class:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};
