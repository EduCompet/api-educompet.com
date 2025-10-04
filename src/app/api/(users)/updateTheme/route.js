// src/app/api/(users)/updateTheme/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import UserModel from "@/app/model/userDataModel/schema";
import { headers } from "next/headers";
import { withCors, handleOptions } from "@/app/utils/cors";

export async function OPTIONS() {
    return handleOptions();
}

export const PUT = async (req) => {
    // 1. Get the custom session token from the header
    const sessionToken = (await headers()).get("authorization")?.split("Bearer ")[1];
    if (!sessionToken) {
        return withCors(NextResponse.json({ message: "Unauthorized: No token provided" }, { status: 401 }));
    }

    try {
        await connectdb();

        // 2. Find the user by their sessionToken
        const user = await UserModel.findOne({ sessionToken: sessionToken });

        if (!user) {
            return withCors(NextResponse.json({ success: false, message: "Unauthorized: Invalid session token." }, { status: 401 }));
        }

        const { theme } = await req.json();

        if (!['system', 'light', 'dark'].includes(theme)) {
            return withCors(NextResponse.json({ success: false, message: "Invalid theme value." }, { status: 400 }));
        }

        // 3. Update the theme for the found user using their MongoDB _id
        const updatedUser = await UserModel.findByIdAndUpdate(
            user._id,
            { $set: { theme: theme } },
            { new: true }
        ).select("theme");

        if (!updatedUser) {
            // This case is unlikely if the user was found, but good practice to keep
            return withCors(NextResponse.json({ success: false, message: "User not found." }, { status: 404 }));
        }

        return withCors(NextResponse.json({
            success: true,
            message: "Theme updated successfully.",
            data: updatedUser
        }, { status: 200 }));

    } catch (error) {
        console.error("!!! Error in user theme update endpoint:", error);
        return withCors(NextResponse.json({ success: false, message: "An unexpected error occurred." }, { status: 500 }));
    }
};