// src/app/api/(job)/coreJobData/route.js
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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "6", 10);
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    // Build the query to filter by active status and search term
    const query = {
      isActive: { $ne: false } 
    };

    if (search) {
      const searchRegex = new RegExp(search, "i"); // Case-insensitive regex
      query.$or = [
        { title: { $regex: searchRegex } },
        { organization: { $regex: searchRegex } },
        { shortDescription: { $regex: searchRegex } },
      ];
    }

    // Get paginated jobs and the total count for the query in parallel
    const [jobs, totalJobs] = await Promise.all([
      JobModel.find(query)
        .populate("createdBy", "fullName email")
        .sort({ postedAt: -1 }) // Sort by most recent post date
        .skip(skip)
        .limit(limit)
        .lean(),
      JobModel.countDocuments(query)
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