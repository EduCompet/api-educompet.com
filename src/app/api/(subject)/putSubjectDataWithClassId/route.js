// app/api/(subject)/putSubjectDataWithClassId/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import SubjectModel from "@/app/model/subjectDataModel/schema";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const PUT = async (req) => {
  const headerList = await headers();
  const reqApiKey = headerList.get("x-api-key");

  // API Key validation
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

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");
    const classIdQuery = searchParams.get("classId");

    if (!subjectId || !classIdQuery) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: "Both subjectId and classId are required query parameters.",
          },
          { status: 400 }
        )
      );
    }

    const body = await req.json();
    const { name, isActive, classId: newClassId, generalSubjectId } = body;

    const updatedData = {};
    if (name) updatedData.name = name;
    if (typeof isActive === "boolean") updatedData.isActive = isActive;
    if (newClassId) updatedData.classId = newClassId;
    if (generalSubjectId) updatedData.generalSubjectId = generalSubjectId;

    if (Object.keys(updatedData).length === 0) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: "No valid fields to update were provided.",
          },
          { status: 400 }
        )
      );
    }

    // Find the subject by its ID and classId and update it
    const updatedSubject = await SubjectModel.findOneAndUpdate(
      { _id: subjectId, classId: classIdQuery }, // Match both subject and class
      { $set: updatedData },
      { new: true, runValidators: true }
    )
      .populate("createdBy", "fullName email")
      .populate("classId", "name")
      .populate("generalSubjectId", "name")
      .lean();

    if (!updatedSubject) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message:
              "No subject found with the provided ID and classId combination.",
          },
          { status: 404 }
        )
      );
    }

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Subject updated successfully.",
          data: updatedSubject,
        },
        { status: 200 }
      )
    );
  } catch (error) {
    console.error("Error updating subject:", error);
    return withCors(
      NextResponse.json(
        { success: false, message: error.message || "Internal Server Error" },
        { status: 500 }
      )
    );
  }
};