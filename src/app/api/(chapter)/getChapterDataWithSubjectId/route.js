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

export const GET = async (req) => {
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

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");

    if (!subjectId) {
      return withCors(
        NextResponse.json(
          { success: false, message: "subjectId is a required query parameter." },
          { status: 400 }
        )
      );
    }

    // ✅ Find chapters by subjectId and populate
    const chapters = await ChapterModel.find({ subjectId })
      .populate("subjectId", "name")
      .populate("createdBy", "fullName email")
      .lean();

    if (!chapters.length) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: "No chapters found for the provided subjectId.",
          },
          { status: 404 }
        )
      );
    }

    return withCors(NextResponse.json(
      { success: true, message: "Chapters fetched successfully.", data: chapters },
      { status: 200 }
    ));
  } catch (error) {
    console.error("Error fetching chapters by subjectId:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};