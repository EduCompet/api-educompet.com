// app/api/(subject)/getSubjectDataWithClassId/route.js
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

export const GET = async (req) => {
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
    const classId = searchParams.get("classId");

    if (!classId) {
      return withCors(
        NextResponse.json(
          { success: false, message: "classId is a required query parameter." },
          { status: 400 }
        )
      );
    }

    // Fetch subjects by classId
    const subjects = await SubjectModel.find({ classId })
      .populate("createdBy", "fullName email")
      .populate("generalSubjectId", "name")
      .lean();

    if (!subjects.length) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: "No subjects found for the provided classId.",
          },
          { status: 404 }
        )
      );
    }

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Subjects fetched successfully.",
          data: subjects,
        },
        { status: 200 }
      )
    );
  } catch (error) {
    console.error("Error fetching subjects by classId:", error);
    return withCors(
      NextResponse.json(
        { success: false, message: error.message || "Internal Server Error" },
        { status: 500 }
      )
    );
  }
};