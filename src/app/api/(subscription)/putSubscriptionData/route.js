import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import SubscriptionModel from "@/app/model/subscriptionsDataModel/schema";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const PUT = async (req) => {
  const headerList = await headers();
  const reqApiKey = headerList.get("x-api-key");

  // 🔑 API Key validation
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
    const subscriptionId = searchParams.get("subscriptionId");

    if (!subscriptionId) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: "subscriptionId is a required query parameter.",
          },
          { status: 400 }
        )
      );
    }

    const body = await req.json();
    const { name, description, isActive, isJobUpdate, pricingPlans, classId } =
      body;

    const updatedData = {};
    if (name) updatedData.name = name;
    if (description) updatedData.description = description;
    if (typeof isActive === "boolean") updatedData.isActive = isActive;
    if (typeof isJobUpdate === "boolean")
      updatedData.isJobUpdate = isJobUpdate;
    if (pricingPlans) updatedData.pricingPlans = pricingPlans;
    if (classId) updatedData.classId = classId;

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

    const updatedSubscription = await SubscriptionModel.findByIdAndUpdate(
      subscriptionId,
      { $set: updatedData },
      { new: true, runValidators: true }
    )
      .populate("createdBy", "fullName email")
      .populate("classId", "name")
      .lean();

    if (!updatedSubscription) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: "No subscription found with the provided ID.",
          },
          { status: 404 }
        )
      );
    }

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Subscription updated successfully.",
          data: updatedSubscription,
        },
        { status: 200 }
      )
    );
  } catch (error) {
    console.error("Error updating subscription:", error);
    return withCors(
      NextResponse.json(
        { success: false, message: error.message || "Internal Server Error" },
        { status: 500 }
      )
    );
  }
};