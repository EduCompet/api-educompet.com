// src/app/api/(generalSubject)/putGeneralSubjectData/[id]/route.js
import { NextResponse } from "next/server";
import {connectdb} from "@/app/database/mongodb";
import GeneralSubjectModel from "@/app/model/generalSubjectDataModel/schema";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const PUT = async (req, { params }) => {
  const headerList = await headers();
  const reqApiKey = headerList.get("x-api-key");

  if (xkey !== reqApiKey) {
    return withCors(NextResponse.json({ success: false, message: "Invalid API Auth Key" }, { status: 401 }));
  }

  try {
    await connectdb();
    const { id } = params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return withCors(NextResponse.json({ success: false, message: "A valid subject ID is required." }, { status: 400 }));
    }

    const body = await req.json();
    const { name, isActive } = body;

    const updateData = {};
    if (name) updateData.name = name;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    if (Object.keys(updateData).length === 0) {
      return withCors(NextResponse.json({ success: false, message: "No valid fields to update were provided." }, { status: 400 }));
    }

    const updatedSubject = await GeneralSubjectModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate("createdBy", "fullName email").populate("allowedClassIds", "name").lean();

    if (!updatedSubject) {
      return withCors(NextResponse.json({ success: false, message: "No subject found with the provided ID." }, { status: 404 }));
    }

    return withCors(NextResponse.json({ success: true, message: "General subject updated successfully.", data: updatedSubject }, { status: 200 }));
  } catch (error) {
    console.error("Error updating general subject:", error);
    return withCors(NextResponse.json({ success: false, message: error.message || "Internal Server Error" }, { status: 500 }));
  }
};