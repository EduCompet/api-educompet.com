// src/app/api/(admin)/getAdminData/route.js
import { NextResponse } from "next/server";
import {connectdb} from "@/app/database/mongodb";
import AdminModel from "@/app/model/adminDataModel/schema";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const GET = async (req) => {
  const headerList = headers();
  const reqApiKey = headerList.get("x-api-key");

  if (xkey !== reqApiKey) {
    return NextResponse.json(
      { success: false, message: "Invalid API Auth Key" },
      { status: 401 }
    );
  }

  try {
    await connectdb();

    // Support query params ?id= for single admin
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    let admins;
    if (id) {
      admins = await AdminModel.findById(id).lean();
      if (!admins) {
        return withCors(NextResponse.json(
          { success: false, message: "Admin not found" },
          { status: 404 }
        ));
      }
    } else {
      admins = await AdminModel.find().lean();
    }

    return withCors( NextResponse.json(
      { success: true, message: "Admin data retrieved successfully.", data: admins },
      { status: 200 }
    )
  );
  } catch (error) {
    console.error("Error fetching admin data:", error);
    return withCors(NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    ));
  }
};
