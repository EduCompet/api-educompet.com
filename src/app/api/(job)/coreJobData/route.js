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

  if (xkey !== reqApiKey) {
    return withCors(
      NextResponse.json({ success: false, message: "Invalid API Auth Key" }, { status: 401 })
    );
  }

  try {
    await connectdb();

    // ✅ Pagination logic starts here
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    // Get the paginated jobs and the total count in parallel
    const [jobs, totalJobs] = await Promise.all([
      JobModel.find({})
        .populate("createdBy", "fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      JobModel.countDocuments({})
    ]);

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Jobs fetched successfully.",
          data: {
            jobs,
            totalJobs,
            currentPage: page,
            totalPages: Math.ceil(totalJobs / limit),
          },
        },
        { status: 200 }
      )
    );
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return withCors(
      NextResponse.json({ success: false, message: error.message || "Internal Server Error" }, { status: 500 })
    );
  }
};