import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import ClassModel from "@/app/model/classDataModel/schema";
import { headers } from "next/headers";
import mongoose from "mongoose";
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const PUT = async (req, { params }) => {
  const { id } = params; // ✅ get id from URL
  const headerList = await headers();
  const reqApiKey = headerList.get("x-api-key");

  if (xkey !== reqApiKey) {
    return withCors(
      NextResponse.json(
        { success: false, message: "Invalid API Auth Key" },
        { status: 401 }
      )
    );
  }

  let session;
  try {
    await connectdb();
    session = await mongoose.startSession();
    session.startTransaction();

    const data = await req.json();
    const { name, isActive } = data;

    const updatedClass = await ClassModel.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
       
        ...(isActive !== undefined && { isActive }),
      },
      { new: true, runValidators: true, session }
    ).populate("createdBy", "fullName email");

    if (!updatedClass) {
      throw new Error("Class not found.");
    }

    await session.commitTransaction();
    session.endSession();

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Class updated successfully.",
          data: updatedClass,
        },
        { status: 200 }
      )
    );
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    console.error("Error updating class:", error);

    return withCors(
      NextResponse.json(
        { success: false, message: error.message || "Internal Server Error" },
        { status: 500 }
      )
    );
  }
};
