// src/app/api/(generalChapter)/getGeneralChapterDataWithSubjectId/route.js
import { NextResponse } from "next/server";
import {connectdb} from "@/app/database/mongodb";
import GeneralChapterModel from "@/app/model/generalChaptersDataModel/schema";
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

  if (xkey !== reqApiKey) {
    return withCors(NextResponse.json(
      { success: false, message: "Invalid API Auth Key" },
      { status: 401 }
    ));
  }

  try {
    await connectdb();

    const { searchParams } = new URL(req.url);
    const generalSubjectId = searchParams.get("generalSubjectId");

    if (!generalSubjectId) {
      return withCors(
        NextResponse.json(
          { success: false, message: "generalSubjectId is a required query parameter." },
          { status: 400 }
        )
      );
    }

    const chapters = await GeneralChapterModel.find({ generalSubjectId })
      .populate("generalSubjectId", "name isActive")
      .populate("createdBy", "fullName email");

    if (!chapters.length) {
      return withCors(
        NextResponse.json(
          {
            success: true, // Returning true here so the frontend can display "No chapters found"
            data: [],
            message: "No chapters found for the provided generalSubjectId.",
          },
          { status: 200 }
        )
      );
    }

    return withCors(NextResponse.json(
      { success: true, message: "Chapters fetched successfully.", data: chapters },
      { status: 200 }
    ));
  } catch (error) {
    console.error("Error fetching chapters by generalSubjectId:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};