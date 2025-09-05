import { NextResponse } from "next/server";
import {connectdb} from "@/app/database/mongodb";
import SubjectModel from "@/app/model/subjectDataModel/schema";
import { headers } from "next/headers";
import ClassModel from "@/app/model/classDataModel/schema";
import AdminModel from "@/app/model/adminDataModel/schema";
import GeneralSubjectModel from "@/app/model/generalSubjectDataModel/schema";
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const GET = async (req, { params }) => {
  const headerList =await headers();
  const reqApiKey = headerList.get("x-api-key");

  // ✅ API Key validation
  if (xkey !== reqApiKey) {
    return withCors(NextResponse.json(
      { success: false, message: "Invalid API Auth Key" },
      { status: 401 }
    ));
  }

  try {
    await connectdb();

    const { id } = params;

    // ✅ Fetch subject by ID with populated references
    const subject = await SubjectModel.findById(id)
      .populate("classId", "name")
      .populate("createdBy", "fullName email")
      .populate("generalSubjectId", "name")
      .lean();

    if (!subject) {
      return withCors(NextResponse.json(
        { success: false, message: "Subject not found" },
        { status: 404 }
      ));
    }

    return withCors(NextResponse.json(
      {
        success: true,
        message: "Subject fetched successfully.",
        data: subject,
      },
      { status: 200 }
    ));
  } catch (error) {
    console.error("Error fetching subject by ID:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};
