import { NextResponse } from "next/server";
import {connectdb} from "@/app/database/mongodb";
import SubjectModel from "@/app/model/subjectDataModel/schema";
import { headers } from "next/headers";
import GeneralSubjectModel from "@/app/model/generalSubjectDataModel/schema";
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const GET = async () => {
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

    // ✅ Fetch all subjects with referenced data
    const subjects = await SubjectModel.find()
      .populate("classId", "name")
      .populate("createdBy", "fullName email")
      .populate("generalSubjectId", "name")
      .lean();

    return withCors(NextResponse.json(
      {
        success: true,
        message: "All subjects fetched successfully.",
        data: subjects,
      },
      { status: 200 }
    ));
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};
