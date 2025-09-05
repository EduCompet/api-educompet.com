// src/app/api/(generalSubject)/getGeneralSubjectDataWithId/[id]/route.js
import { NextResponse } from "next/server";
import {connectdb} from "@/app/database/mongodb";
import GeneralSubjectModel from "@/app/model/generalSubjectDataModel/schema";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const GET = async (req, { params }) => {
  const headerList =await headers();
  const reqApiKey = headerList.get("x-api-key");

  if (xkey !== reqApiKey) {
    return withCors(NextResponse.json(
      { success: false, message: "Invalid API Auth Key" },
      { status: 401 }
    ));
  }

  try {
    await connectdb();

    const { Id } = params;

    const subject = await GeneralSubjectModel.findById(Id)
      .populate("createdBy", "fullName email")
      .populate("allowedClassIds", "name")
      .lean();

    if (!subject) {
      return withCors(NextResponse.json(
        { success: false, message: "General Subject not found" },
        { status: 404 }
      ));
    }

    return withCors(NextResponse.json(
      {
        success: true,
        message: "General subject fetched successfully.",
        data: subject,
      },
      { status: 200 }
    ));
  } catch (error) {
    console.error("Error fetching general subject:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};
