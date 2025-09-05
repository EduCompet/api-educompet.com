// src/app/api/(generalSubject)/postGeneralSubjectData/route.js
import { NextResponse } from "next/server";
import {connectdb} from "@/app/database/mongodb";
import GeneralSubjectModel from "@/app/model/generalSubjectDataModel/schema";
import mongoose from "mongoose";
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

  if (xkey !== reqApiKey) {
    return withCors(NextResponse.json(
      { success: false, message: "Invalid API Auth Key" },
      { status: 401 }
    ));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await connectdb();
    const body = await req.json();
    const { name, createdBy, visibility, allowedClassIds } = body;

    if (!name || !createdBy) {
      throw new Error("name and createdBy are required.");
    }

    if (visibility === "whitelist" && (!allowedClassIds || allowedClassIds.length === 0)) {
      throw new Error("allowedClassIds are required when visibility is whitelist.");
    }

    const newGeneralSubject = await GeneralSubjectModel.create(
      [
        {
          name,
          createdBy,
          visibility: visibility || "all",
          allowedClassIds: visibility === "whitelist" ? allowedClassIds : [],
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return withCors(NextResponse.json(
      {
        success: true,
        message: "General subject created successfully.",
        data: newGeneralSubject[0],
      },
      { status: 201 }
    ));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating general subject:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};
