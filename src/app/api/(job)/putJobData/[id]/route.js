// src/app/api/(job)/putJobData/[id]/route.js
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

export const PUT = async (req, { params }) => {
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

    const { id } = params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return withCors(
        NextResponse.json(
          { success: false, message: "A valid jobId is required." },
          { status: 400 }
        )
      );
    }

    const body = await req.json();
    const {
      title,
      organization,
      shortDescription,
      description,
      applyLink,
      deadline,
      qualification,
      vacancy,
      category,
      isActive,
    } = body;

    const updatedData = {};
    if (title) updatedData.title = title;
    if (organization) updatedData.organization = organization;
    if (shortDescription) updatedData.shortDescription = shortDescription;
    if (description) updatedData.description = description;
    if (applyLink) updatedData.applyLink = applyLink;
    if (deadline) updatedData.deadline = deadline;
    if (qualification) updatedData.qualification = qualification;
    if (vacancy) updatedData.vacancy = vacancy;
    if (category) updatedData.category = category;
    if (isActive) updatedData.isActive = isActive;

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

    const updatedJob = await JobModel.findByIdAndUpdate(
      id,
      { $set: updatedData },
      { new: true, runValidators: true }
    )
      .populate("createdBy", "fullName email")
      .lean();

    if (!updatedJob) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: "No job found with the provided ID.",
          },
          { status: 404 }
        )
      );
    }

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Job updated successfully.",
          data: updatedJob,
        },
        { status: 200 }
      )
    );
  } catch (error) {
    console.error("Error updating job by ID:", error);
    return withCors(
      NextResponse.json(
        { success: false, message: error.message || "Internal Server Error" },
        { status: 500 }
      )
    );
  }
};