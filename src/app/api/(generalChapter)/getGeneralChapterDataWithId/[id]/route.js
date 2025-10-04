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

// ✅ GET by ID
export const GET = async (req, { params }) => {
  const headerList =await headers();
  const reqApiKey = headerList.get("x-api-key");

  // API Key validation
  if (xkey !== reqApiKey) {
    return withCors(NextResponse.json(
      { success: false, message: "Invalid API Auth Key" },
      { status: 401 }
    ));
  }

  try {
    await connectdb();

    const { id } = params;

    const chapter = await GeneralChapterModel.findById(id)
      .populate("generalSubjectId", "name isActive")
      .populate("createdBy", "fullName email");

    if (!chapter) {
      return withCors(NextResponse.json(
        { success: false, message: "General Chapter not found" },
        { status: 404 }
      ));
    }

    return NextResponse.json(
      { success: true, data: chapter },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching general chapter by ID:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};
