// pages/api/content/get-signed-url.js
import { mongoClientPromise as clientPromise } from "@/app/database/mongodb";
import { bucket } from "@/app/service/storageConnection/storageConnection";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { userId, classId, filePath } = req.body;
    if (!userId || !classId || !filePath) return res.status(400).json({ error: "userId, classId, filePath required" });

    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);

    // check active subscription in userSubscriptions
    const userSubs = await db.collection("userSubscriptions").findOne({userId: new require("mongoose").Types.ObjectId(userId) });
    if (!userSubs || !Array.isArray(userSubs.subscriptions)) return res.status(403).json({ error: "not subscribed" });

    const now = new Date();
    const hasActive = userSubs.subscriptions.some((s) => {
      return s.classId.toString() === classId.toString() && s.status === "active" && new Date(s.expireDate) >= now;
    });

    if (!hasActive) return res.status(403).json({ error: "no active subscription for this class" });

    // Generate signed URL
    const file = bucket.file(filePath); // e.g. "class_<id>/math/algebra.pdf"
    const expires = Date.now() + 15 * 60 * 1000; // 15 minutes

    const [url] = await file.getSignedUrl({
      action: "read",
      expires,
    });

    res.status(200).json({ signedUrl: url, expiresAt: expires });
  } catch (err) {
    console.error("signed-url err:", err);
    res.status(500).json({ error: err.message });
  }
}