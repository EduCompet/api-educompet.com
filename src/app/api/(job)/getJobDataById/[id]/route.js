// src/app/api/(job)/getJobDataById/[id]/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import JobModel from "@/app/model/jobModel/schema";
import AdminModel from "@/app/model/adminDataModel/schema";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const GET = async (req, { params }) => {
  const headerList = await headers();
  const reqApiKey = headerList.get("x-api-key");

  if (xkey !== reqApiKey) {
    return withCors(NextResponse.json({ success: false, message: "Invalid API Auth Key" }, { status: 401 }));
  }

  try {
    await connectdb();
    const { id } = params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return withCors(NextResponse.json({ success: false, message: "A valid job ID is required." }, { status: 400 }));
    }

    const job = await JobModel.findById(id).populate("createdBy", "fullName email").lean();

    if (!job) {
      return withCors(NextResponse.json({ success: false, message: "Job not found." }, { status: 404 }));
    }

    return withCors(NextResponse.json({ success: true, message: "Job fetched successfully.", data: job }, { status: 200 }));
  } catch (error) {
    console.error("Error fetching job by ID:", error);
    return withCors(NextResponse.json({ success: false, message: error.message || "Internal Server Error" }, { status: 500 }));
  }
};