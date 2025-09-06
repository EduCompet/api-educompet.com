// src/app/api/(job)/postJobData/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import JobModel from "@/app/model/jobModel/schema";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";
import admin from "@/app/utils/firebaseAdmin";
import SubscriptionModel from "@/app/model/subscriptionsDataModel/schema";
import UserSubscriptionModel from "@/app/model/userSubscriptionModel/schema";
import UserModel from "@/app/model/userDataModel/schema";


export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const POST = async (req) => {
  const headerList = await headers();
  const reqApiKey = headerList.get("x-api-key");

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
    if (!title || !organization || !shortDescription || !description || !applyLink || !deadline || !createdBy) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: "title, organization, shortDescription, description, applyLink, deadline, and createdBy are required fields.",
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
    
    // --- Start Notification Logic ---
    // We run this after creating the job but don't want it to block the response if it fails.
    try {
      // 1. Find all subscription plan IDs that are for job updates.
      const jobPlans = await SubscriptionModel.find({ isJobUpdate: true }).select('_id').lean();
      const jobPlanIds = jobPlans.map(plan => plan._id);

      if (jobPlanIds.length > 0) {
        // 2. Find all users with an active subscription to one of those plans.
        const userSubs = await UserSubscriptionModel.find({
          "subscriptions": {
            "$elemMatch": {
              "subscriptionId": { "$in": jobPlanIds },
              "status": "active",
              "expireDate": { "$gt": new Date() }
            }
          }
        }).select('userId').lean();
        
        const userIds = userSubs.map(sub => sub.userId);

        if (userIds.length > 0) {
          // 3. Get the FCM tokens for these users.
          const usersWithTokens = await UserModel.find({
            _id: { "$in": userIds },
            fcmToken: { $exists: true, $ne: null }
          }).select('fcmToken').lean();
          
          const tokens = usersWithTokens.map(user => user.fcmToken);

          if (tokens.length > 0) {
            // 4. Send the notification via FCM.
            const message = {
              notification: {
                title: 'New Job Opportunity! 💼',
                body: `${newJob.title} at ${newJob.organization}`
              },
              data: {
                type: 'JOB_UPDATE',
                jobId: newJob._id.toString()
              },
              tokens: tokens,
            };
            
            const response = await admin.messaging().sendMulticast(message);
            console.log(`${response.successCount} job update notifications sent successfully.`);
          }
        }
      }
    } catch (notificationError) {
      console.error("Failed to send job update notifications:", notificationError);
      // Do not re-throw error; the job was created successfully regardless.
    }
    // --- End Notification Logic ---

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