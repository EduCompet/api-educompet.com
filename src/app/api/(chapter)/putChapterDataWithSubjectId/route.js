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

export const PUT = async (req) => {
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
    const chapterId = searchParams.get("chapterId");

    if (!chapterId) {
      return withCors(
        NextResponse.json(
          { success: false, message: "chapterId is a required query parameter." },
          { status: 400 }
        )
      );
    }

    const body = await req.json();
    const { name, media } = body;

    const updatedData = {};
    if (name) updatedData.name = name;
    if (media) updatedData.media = media;


    if (Object.keys(updatedData).length === 0) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: "No valid fields to update were provided.",
          },
          { status: 400 }
        )
      );
    }

    // ✅ Find chapter by ID and update
    const updatedChapter = await ChapterModel.findByIdAndUpdate(
      chapterId,
      { $set: updatedData },
      { new: true, runValidators: true }
    )
      .populate("subjectId", "name")
      .populate("createdBy", "fullName email")
      .lean();

    if (!updatedChapter) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: "No chapter found with the provided ID.",
          },
          { status: 404 }
        )
      );
    }

    return withCors(NextResponse.json(
      { success: true, message: "Chapter updated successfully.", data: updatedChapter },
      { status: 200 }
    ));
  } catch (error) {
    console.error("Error updating chapter by ID:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};