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

export const POST = async (req) => {
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

    const body = await req.json();
    const { subjectId, name, media, createdBy } = body;

    // ✅ Validation
    if (!subjectId || !name || !createdBy) {
      return withCors(NextResponse.json(
        { success: false, message: "subjectId, name, and createdBy are required." },
        { status: 400 }
      ));
    }

    // ✅ Create Chapter
    const newChapter = await ChapterModel.create({
      subjectId,
      name,
      media: media || [],
      createdBy,
    });

    return withCors(NextResponse.json(
      {
        success: true,
        message: "Chapter created successfully.",
        data: newChapter,
      },
      { status: 201 }
    ));
  } catch (error) {
    console.error("Error creating chapter:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};
