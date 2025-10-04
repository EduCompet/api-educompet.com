import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import JobModel from "@/app/model/jobModel/schema";
import AdminModel from "@/app/model/adminDataModel/schema";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const GET = async (req) => {
  const headerList = await headers();
  const reqApiKey = headerList.get("x-api-key");

  // API Key validation
  if (xkey !== reqApiKey) {
    return withCors(
      NextResponse.json(
        { success: false, message: "Invalid API Auth Key" },
        { status: 401 }
      )
    );
  }

  try {
    await connectdb();

    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get("search");
    const category = searchParams.get("category");

    let query = {};

    if (searchQuery) {
      query.$text = { $search: searchQuery };
    }

    if (category) {
      query.category = category;
    }

    const jobs = await JobModel.find(query)
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 })
      .lean();

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "All jobs fetched successfully.",
          data: jobs,
        },
        { status: 200 }
      )
    );
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return withCors(
      NextResponse.json(
        { success: false, message: error.message || "Internal Server Error" },
        { status: 500 }
      )
    );
  }
};