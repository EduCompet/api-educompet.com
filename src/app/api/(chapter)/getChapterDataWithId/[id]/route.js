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

export const GET = async (req, { params }) => {
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

    const { id } = params;

    // ✅ Find chapter by ID and populate
    const chapter = await ChapterModel.findById(id)
      .populate("subjectId", "name")
      .populate("createdBy", "fullName email")
      .lean();

    if (!chapter) {
      return withCors(NextResponse.json(
        { success: false, message: "Chapter not found." },
        { status: 404 }
      ));
    }

    return withCors(NextResponse.json(
      { success: true, message: "Chapter fetched successfully.", data: chapter },
      { status: 200 }
    ));
  } catch (error) {
    console.error("Error fetching chapter by ID:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};
