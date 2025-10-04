// // src/app/api/(users)/loginOrSignUp/route.js
// import { NextResponse } from "next/server";
// import { connectdb } from "@/app/database/mongodb";
// import UserModel from "@/app/model/userDataModel/schema";
// import UserSubscriptionModel from "@/app/model/userSubscriptionModel/schema";
// import { headers } from "next/headers";
// import { handleOptions, withCors } from "@/app/utils/cors";

// export const dynamic = "force-dynamic";
// const xkey = process.env.API_AUTH_KEY;

// export async function OPTIONS() {
//   return handleOptions();
// }

// export const POST = async (req) => {
//   const reqApiKey = (await headers()).get("x-api-key");
//   if (xkey !== reqApiKey) {
//     return withCors(NextResponse.json({ success: false, message: "Invalid API Auth Key" }, { status: 401 }));
//   }

//   try {
//     await connectdb();
//     const data = await req.json();

//     const { firebaseUid, email, fullName, photoUrl, dob, phone, fcmToken, referralId } = data;

//     if (!firebaseUid || !email) {
//       return withCors(NextResponse.json({ success: false, message: "Firebase UID and email are required." }, { status: 400 }));
//     }

//     const existingUser = await UserModel.findOne({ firebaseUid: firebaseUid });

//     if (existingUser) {
//       const updateData = { lastLogin: new Date(), ...(fcmToken && { fcmToken }) };
//       const updatedUser = await UserModel.findOneAndUpdate({ firebaseUid }, { $set: updateData }, { new: true });
//       return withCors(NextResponse.json({ success: true, message: "User logged in.", data: updatedUser, isNewUser: false }, { status: 200 }));
//     }

//     const newUser = await UserModel.create({
//       firebaseUid,
//       email,
//       fullName,
//       photoUrl,
//       dob,
//       phone,
//       fcmToken,
//       referralId,
//     });

//     await UserSubscriptionModel.create({
//       userId: newUser._id,
//       subscriptions: [],
//     });

//     return withCors(NextResponse.json({ success: true, message: "User created successfully.", data: newUser, isNewUser: true }, { status: 201 }));

//   } catch (error) {
//     let message = "An unexpected error occurred.";
//     let statusCode = 500;

//     if (error.code === 11000) {
//       const duplicateField = Object.keys(error.keyValue)[0];
//       message = `A user with this ${duplicateField} already exists.`;
//       statusCode = 409;
//     } else if (error.name === 'ValidationError') {
//       message = error.message;
//       statusCode = 400;
//     } else if (error.message) {
//       message = error.message;
//     }

//     console.error("!!! Error in /loginOrSignUp endpoint:", error);

//     return withCors(NextResponse.json({ success: false, message }, { status: statusCode }));
//   }
// };