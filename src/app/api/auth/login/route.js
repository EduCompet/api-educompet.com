import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import UserModel from "@/app/model/userDataModel/schema";
import admin from "@/app/utils/firebaseAdmin";
import { headers } from "next/headers";

export const POST = async (req) => {
  const authToken = headers().get("authorization")?.split("Bearer ")[1];

  if (!authToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(authToken);
    const { uid } = decodedToken;

    await connectdb();
    const user = await UserModel.findOne({ firebaseUid: uid });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    if (error.code === "auth/id-token-expired") {
      return NextResponse.json({ message: "Token expired" }, { status: 401 });
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
};