import { NextResponse } from "next/server";
import {connectdb} from "@/app/database/mongodb";
import SubjectModel from "@/app/model/subjectDataModel/schema";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const POST = async (req) => {
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
    const data = await req.json();
    const { classId, name, createdBy, generalSubjectId } = data;

    // ✅ Basic validations
    if (!classId || !name || !createdBy) {
      return withCors(NextResponse.json(
        {
          success: false,
          message: "classId, name, and createdBy are required fields.",
        },
        { status: 400 }
      ));
    }

    // ✅ Create new subject
    const newSubject = await SubjectModel.create({
      classId,
      name,
      createdBy,
      generalSubjectId: generalSubjectId || null,
    });

    return withCors(NextResponse.json(
      {
        success: true,
        message: "Subject created successfully.",
        data: newSubject,
      },
      { status: 201 }
    ));
  } catch (error) {
    console.error("Error creating subject:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};
