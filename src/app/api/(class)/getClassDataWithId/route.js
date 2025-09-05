// src/app/api/(class)/getClassDataWithId/route.js
import { NextResponse } from "next/server";
import {connectdb} from "@/app/database/mongodb";
import ClassModel from "@/app/model/classDataModel/schema";
import { headers } from "next/headers";
import AdminModel from "@/app/model/adminDataModel/schema";
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const GET = async (req) => {
  const headerList = await headers();
  const reqApiKey = headerList.get("x-api-key");

  if (xkey !== reqApiKey) {
    return withCors(NextResponse.json(
      { success: false, message: "Invalid API Auth Key" },
      { status: 401 }
    ));
  }

  try {
    await connectdb();

    // Extract `Id` from query params
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("Id");

    if (!classId) {
      return withCors(NextResponse.json(
        { success: false, message: "classId is required in query params" },
        { status: 400 }
      ));
    }

    const classDoc = await ClassModel.findById(classId)
      .populate("createdBy", "fullName email") // optional → fetch admin info
      .lean();

    if (!classDoc) {
      return withCors(NextResponse.json(
        { success: false, message: "Class not found" },
        { status: 404 }
      ));
    }

    return withCors(NextResponse.json(
      {
        success: true,
        message: "Class data fetched successfully.",
        data: classDoc,
      },
      { status: 200 }
    ));
  } catch (error) {
    console.error("Error fetching class data by ID:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};
