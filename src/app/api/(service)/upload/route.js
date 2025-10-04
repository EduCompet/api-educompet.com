import { NextResponse } from "next/server";
import mammoth from "mammoth";
import htmlPdf from "html-pdf-node";
import { bucket } from "@/app/service/storageConnection/storageConnection";
import { withCors, handleOptions } from "@/app/utils/cors";

export const dynamic = "force-dynamic";
// optional but recommended if using Node libs:
export const runtime = "nodejs";

const apiKey = process.env.API_AUTH_KEY;

export async function OPTIONS(req) {
  return handleOptions(req);
}

export async function POST(req) {
  const reqApiKey = req.headers.get("x-api-key");
  if (apiKey !== reqApiKey) {
    return withCors(
      NextResponse.json({ success: false, error: "Invalid API Auth Key" }, { status: 401 })
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file) {
      return withCors(
        NextResponse.json({ success: false, error: "No file was uploaded." }, { status: 400 })
      );
    }

    const originalFilename = file.name || "untitled";
    const mime = file.type || "application/octet-stream";

    // Build a safe base name (no extension) for the output PDF
    const base = originalFilename.replace(/\.[^.]+$/, "");
    const safeBase = base.replace(/[^\w\-]+/g, "_");

    let buffer;
    let contentType = "application/pdf";

    if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const arrayBuffer = await file.arrayBuffer();
      const { value: html } = await mammoth.convertToHtml({ buffer: Buffer.from(arrayBuffer) });
      buffer = await htmlPdf.generatePdf({ content: html }, { format: "A4" });
    } else if (mime === "application/pdf") {
      buffer = Buffer.from(await file.arrayBuffer());
    } else {
      return withCors(
        NextResponse.json({ success: false, error: `File type ${mime} is not supported.` }, { status: 415 })
      );
    }

    // Store under the documents "folder" (prefix)
    const objectName = `documents/${Date.now()}-${safeBase}.pdf`;
    const blob = bucket.file(objectName);

    await blob.save(buffer, { resumable: false, contentType });
    await blob.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
    return withCors(NextResponse.json({ success: true, url: publicUrl }, { status: 200 }));
  } catch (error) {
    console.error("SERVER ERROR:", error);
    return withCors(
      NextResponse.json({ success: false, error: "An internal server error occurred." }, { status: 500 })
    );
  }
}
