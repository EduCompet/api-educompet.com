import { NextResponse } from "next/server";
import {connectdb} from "@/app/database/mongodb";
import ChapterModel from "@/app/model/chapterDataModel/schema";
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

  // ✅ API Key check
  if (xkey !== reqApiKey) {
    return withCors(NextResponse.json(
      { success: false, message: "Invalid API Auth Key" },
      { status: 401 }
    ));
  }

  try {
    await connectdb();

    // ✅ Fetch all chapters with population
    const chapters = await ChapterModel.find()
      .populate("subjectId", "name") // only get subject name
      .populate("createdBy", "fullName email") // only basic admin info
      .lean();

    return withCors(NextResponse.json(
      {
        success: true,
        message: "All chapters fetched successfully.",
        data: chapters,
      },
      { status: 200 }
    ));
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};
