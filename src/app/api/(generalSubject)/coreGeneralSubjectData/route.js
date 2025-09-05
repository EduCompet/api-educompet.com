// src/app/api/(generalSubject)/coreGeneralSubjectData/route.js
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

export const GET = async () => {
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

    const subjects = await GeneralSubjectModel.find()
      .populate("createdBy", "fullName email") // show admin info
      .populate("allowedClassIds", "name") // show class names if whitelist
      .sort({ createdAt: -1 })
      .lean();

    return withCors(NextResponse.json(
      {
        success: true,
        message: "General subjects fetched successfully.",
        data: subjects,
      },
      { status: 200 }
    ));
  } catch (error) {
    console.error("Error fetching general subjects:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};
