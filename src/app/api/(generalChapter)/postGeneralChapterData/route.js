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

export const POST = async (req) => {
  const headerList = await headers();
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

    const data = await req.json();
    const { generalSubjectId, name, media, createdBy } = data;

    // ✅ Validation
    if (!generalSubjectId || !name || !createdBy) {
      return withCors(NextResponse.json(
        { success: false, message: "generalSubjectId, name, and createdBy are required." },
        { status: 400 }
      ));
    }

    // ✅ Create document
    const newGeneralChapter = await GeneralChapterModel.create({
      generalSubjectId,
      name,
      media: media || [],
      createdBy,
    });

    return withCors(NextResponse.json(
      {
        success: true,
        message: "General Chapter created successfully.",
        data: newGeneralChapter,
      },
      { status: 201 }
    ));
  } catch (error) {
    console.error("Error creating general chapter:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};
