// src/app/api/(job)/postJobData/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import JobModel from "@/app/model/jobModel/schema";
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
    const body = await req.json();
    const {
      title,
      organization,
      shortDescription,
      description,
      applyLink,
      deadline,
      createdBy,
      qualification,
      vacancy,
      category,
    } = body;

    // Validation for required fields
    if (
      !title ||
      !organization ||
      !shortDescription ||
      !description ||
      !applyLink ||
      !deadline ||
      !createdBy
    ) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message:
              "title, organization, shortDescription, description, applyLink, deadline, and createdBy are required fields.",
          },
          { status: 400 }
        )
      );
    }

    // Create new job
    const newJob = await JobModel.create({
      title,
      organization,
      shortDescription,
      description,
      applyLink,
      deadline,
      createdBy,
      qualification,
      vacancy,
      category,
    });

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Job created successfully.",
          data: newJob,
        },
        { status: 201 }
      )
    );
  } catch (error) {
    console.error("Error creating job:", error);
    return withCors(
      NextResponse.json(
        { success: false, message: error.message || "Internal Server Error" },
        { status: 500 }
      )
    );
  }
};