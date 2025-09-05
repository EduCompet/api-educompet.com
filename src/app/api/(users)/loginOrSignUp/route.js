// src/app/api/users/loginOrSignUp/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import UserModel from "@/app/model/userDataModel/schema";
import UserSubscriptionModel from "@/app/model/userSubscriptionModel/schema"; // Import the subscription model
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
    return withCors(
      NextResponse.json(
        { success: false, message: "Invalid API Auth Key" },
        { status: 401 }
      )
    );
  }

  try {
    await connectdb();
    const data = await req.json();
    const { email, fullName, photoUrl, dob, phone, referralCode } = data;

    if (!email) {
      return withCors(
        NextResponse.json({ success: false, message: "Email is required." }, { status: 400 })
      );
    }

    let user = await UserModel.findOne({ email });

    if (user) {
      // --- EXISTING USER ---
      user.lastLogin = new Date(); // Update last login time
      await user.save();

      return withCors(
        NextResponse.json(
          { success: true, message: "User logged in successfully.", data: user },
          { status: 200 }
        )
      );
    } else {
      // --- NEW USER ---
      const newUserDetails = {
        fullName,
        email,
        photoUrl,
        dob,
        phone,
        lastLogin: new Date(), // ✅ Set lastLogin for new users
      };

      // ✅ Process the referral code if it exists
      if (referralCode) {
        const referringUser = await UserModel.findOne({ referralCode: referralCode });
        if (referringUser) {
          // If a user with that code is found, save their ID
          newUserDetails.referralId = referringUser._id;
        }
      }

      const newUser = await UserModel.create(newUserDetails);
      
      // Create an empty subscription document for the new user
      await UserSubscriptionModel.create({
        userId: newUser._id,
        subscriptions: [],
      });


      return withCors(
        NextResponse.json(
          { success: true, message: "User created successfully.", data: newUser },
          { status: 201 }
        )
      );
    }
  } catch (error) {
    console.error("Error in loginOrSignUp:", error);
    return withCors(
      NextResponse.json(
        { success: false, message: error.message || "Internal Server Error" },
        { status: 500 }
      )
    );
  }
};