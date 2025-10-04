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

    // ✅ Fetch all general chapters
    const chapters = await GeneralChapterModel.find()
      .populate("generalSubjectId", "name isActive") // only fetch these fields
      .populate("createdBy", "fullName email"); // show admin info

    return withCors(NextResponse.json(
      {
        success: true,
        total: chapters.length,
        data: chapters,
      },
      { status: 200 }
    ));
  } catch (error) {
    console.error("Error fetching general chapters:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};
