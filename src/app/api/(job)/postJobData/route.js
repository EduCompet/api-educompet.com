// src/app/api/(job)/postJobData/route.js

import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import JobModel from "@/app/model/jobModel/schema";
import { headers } from "next/headers";
import { handleOptions, withCors } from "@/app/utils/cors";

// ✅ Import the initialized admin instance
import admin from "@/app/utils/firebaseAdmin"; 

// Import all necessary models
import SubscriptionModel from "@/app/model/subscriptionsDataModel/schema";
import UserSubscriptionModel from "@/app/model/userSubscriptionModel/schema";
import UserModel from "@/app/model/userDataModel/schema";
import NotificationModel from "@/app/model/notificationModel/schema";

export const dynamic = "force-dynamic";

const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const POST = async (req) => {
  console.log("🚀 POST /api/postJobData - Starting job creation process");
  
  const head = await headers();
  const xapikey = head.get("x-api-key");

  if (xapikey !== xkey) {
    console.log("❌ Unauthorized access attempt - Invalid API key");
    return withCors(
      NextResponse.json({ message: "You are not authorized" }, { status: 401 })
    );
  }

  console.log("✅ API key validation passed");

  try {
    console.log("📡 Connecting to database...");
    await connectdb();
    console.log("✅ Database connected successfully");

    const body = await req.json();
    console.log("📝 Request body received:", JSON.stringify(body, null, 2));

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

    // Validate required fields
    const requiredFields = { title, organization, shortDescription, description, applyLink, deadline, createdBy };
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      console.log("❌ Missing required fields:", missingFields);
      return withCors(
        NextResponse.json({ message: `Missing required fields: ${missingFields.join(', ')}` }, { status: 400 })
      );
    }

    console.log("✅ All required fields validated");

    console.log("💾 Creating new job in database...");
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

    console.log("✅ Job created successfully with ID:", newJob._id.toString());
    console.log("📊 Job details:", {
      title: newJob.title,
      organization: newJob.organization,
      deadline: newJob.deadline
    });

    // --- Enhanced Notification Logic with Detailed Logging ---
    console.log("\n🔔 Starting notification process...");
    
    try {
      console.log("🔍 Step 1: Finding subscription plans for job updates...");
      
      // 1. Find all subscription plan IDs that are for job updates.
      const jobPlans = await SubscriptionModel.find({ isJobUpdate: true }).select('_id name').lean();
      console.log(`📋 Found ${jobPlans.length} job update subscription plans:`, 
        jobPlans.map(plan => ({ id: plan._id, name: plan.name || 'Unnamed' }))
      );
      
      if (jobPlans.length === 0) {
        console.log("⚠️ No job update subscription plans found. Skipping notifications.");
        return withCors(
          NextResponse.json(
            { success: true, message: "Job created, but no job plans found for notifications.", data: newJob },
            { status: 201 }
          )
        );
      }

      const jobPlanIds = jobPlans.map(plan => plan._id);
      console.log("📝 Job plan IDs to search for:", jobPlanIds);

      console.log("🔍 Step 2: Finding users with active subscriptions...");
      
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

      console.log(`👥 Found ${userSubs.length} users with active job update subscriptions`);
      
      const userIds = userSubs.map(sub => sub.userId);
      console.log("📝 User IDs with active subscriptions:", userIds);

      if (userIds.length === 0) {
        console.log("⚠️ No users with active job update subscriptions found.");
        return withCors(
          NextResponse.json(
            { success: true, message: "Job created, but no active subscribers found.", data: newJob },
            { status: 201 }
          )
        );
      }

      console.log("🔍 Step 3: Getting FCM tokens for subscribed users...");
      
      // 3. Get the FCM tokens for these users.
      const usersWithTokens = await UserModel.find({
        _id: { "$in": userIds },
        fcmToken: { $exists: true, $ne: null }
      }).select('fcmToken email').lean();

      console.log(`📱 Found ${usersWithTokens.length} users with FCM tokens out of ${userIds.length} total users`);
      
      const tokens = usersWithTokens.map(user => user.fcmToken).filter(Boolean);
      console.log(`🎯 Valid FCM tokens count: ${tokens.length}`);
      
      // Log sample tokens (first few characters for security)
      tokens.forEach((token, idx) => {
        console.log(`Token ${idx + 1}: ${token.substring(0, 20)}...`);
      });

      if (tokens.length === 0) {
        console.log("⚠️ No users with valid FCM tokens found.");
        return withCors(
          NextResponse.json(
            { success: true, message: "Job created, but no valid FCM tokens found.", data: newJob },
            { status: 201 }
          )
        );
      }

      console.log("🔍 Step 4: Preparing push notification message...");
      
      // 4. Prepare the notification message
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

      console.log("📨 Notification message prepared:");
      console.log("  Title:", message.notification.title);
      console.log("  Body:", message.notification.body);
      console.log("  Data:", message.data);
      console.log("  Token count:", message.tokens.length);

      console.log("🚀 Step 5: Sending push notifications...");
      
      try {
        console.log("📡 Attempting to send via sendEachForMulticast...");
        
        // Check if Firebase Admin is properly initialized
        if (!admin || !admin.messaging) {
          throw new Error("Firebase Admin not properly initialized");
        }

        console.log("✅ Firebase Admin messaging service is available");
        
        // ✅ NEW METHOD: Use sendEachForMulticast (replacement for sendMulticast)
        const response = await admin.messaging().sendEachForMulticast(message);
        
        console.log("🎉 sendEachForMulticast completed!");
        console.log("📊 Response details:");
        console.log(`  ✅ Success count: ${response.successCount}`);
        console.log(`  ❌ Failure count: ${response.failureCount}`);
        
        if (response.failureCount > 0) {
          console.log("🔍 Analyzing failures:");
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              console.error(`  ❌ Token ${idx + 1}: ${resp.error?.code} - ${resp.error?.message}`);
            } else {
              console.log(`  ✅ Token ${idx + 1}: Sent successfully`);
            }
          });
        }

        console.log("💾 Step 6: Saving notifications to database...");
        
        // 5. Save notifications to the database for the inbox feature.
const notifications = userIds.map(userId => ({
            userId: userId,
            title: message.notification.title,
            message: message.notification.body,
            // ✅ FIX: Use the standardized field names
            type: 'JOB_UPDATE',
                      jobId: newJob._id.toString(),
            notificationType: 'Job_update', // Match schema
            entityId: newJob._id.toString(),
            isRead: false,
          }));

        console.log(`📝 Preparing to save ${notifications.length} notifications to database`);
        await NotificationModel.insertMany(notifications);
        console.log(`✅ ${notifications.length} notifications saved to database successfully`);

      } catch (fcmError) {
        console.error("❌ FCM Error during sendEachForMulticast:");
        console.error("Error name:", fcmError.name);
        console.error("Error message:", fcmError.message);
        console.error("Error code:", fcmError.code);
        console.error("Full error:", JSON.stringify(fcmError, null, 2));
        
        // ✅ FALLBACK: Send individual messages if batch fails
        console.log("🔄 Attempting fallback: sending individual notifications...");
        let successCount = 0;
        let failureCount = 0;
        
        for (let i = 0; i < tokens.length; i++) {
          const token = tokens[i];
          console.log(`📤 Sending individual notification ${i + 1}/${tokens.length}...`);
          
          try {
            await admin.messaging().send({
              notification: {
                title: 'New Job Opportunity! 💼',
                body: `${newJob.title} at ${newJob.organization}`
              },
              data: {
                type: 'JOB_UPDATE',
                jobId: newJob._id.toString()
              },
              token: token,
            });
            successCount++;
            console.log(`  ✅ Individual send ${i + 1} successful`);
          } catch (individualError) {
            failureCount++;
            console.error(`  ❌ Individual send ${i + 1} failed:`, individualError.code, individualError.message);
          }
        }
        
        console.log(`🎯 Individual send results: ${successCount} successful, ${failureCount} failed`);
        
        // Still save notifications to database even if FCM fails
        console.log("💾 Saving notifications to database (fallback)...");
        const notifications = userIds.map(userId => ({
            userId: userId,
            title: message.notification.title,
            // ✅ FIX: Change 'body' to 'message' to match your schema
            message: message.notification.body, 
            notificationType: 'Job_update', // Match schema
            jobId: newJob._id.toString(),    // Match schema
            isRead: false,
        }));

        await NotificationModel.insertMany(notifications);
        console.log(`✅ ${notifications.length} notifications saved to database (fallback)`);
      }
      
    } catch (notificationError) {
      console.error("❌ Critical error in notification process:");
      console.error("Error name:", notificationError.name);
      console.error("Error message:", notificationError.message);
      console.error("Error stack:", notificationError.stack);
      console.error("Full error object:", JSON.stringify(notificationError, null, 2));
    }

    console.log("🎉 Job creation and notification process completed!");
    
    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Job created and notifications dispatched.",
          data: newJob,
        },
        { status: 201 }
      )
    );
    
  } catch (error) {
    console.error("💥 Critical error in postJobData:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error object:", JSON.stringify(error, null, 2));
    
    return withCors(
      NextResponse.json(
        {
          success: false,
          message: "An error occurred while creating the job.",
          error: error.message,
        },
        { status: 500 }
      )
    );
  }
};
