/**
 * app/api/upload/route.ts
 *
 * POST /api/upload — handles file uploads to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const MIN_FILE_SIZE = 500 * 1024; // 500KB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const requirementKey = formData.get("requirementKey") as string | null;
    const applicantId = formData.get("applicantId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 3 MB." },
        { status: 413 },
      );
    }

    if (file.size < MIN_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too small. Minimum size is 500 KB." },
        { status: 400 },
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Allowed: PDF, PNG, JPG, DOC, DOCX.",
        },
        { status: 415 },
      );
    }

    // Generate a unique filename
    const ext = file.name.substring(file.name.lastIndexOf("."));
    const baseName = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 60);
    const timestamp = Date.now();
    const prefix = [applicantId, requirementKey].filter(Boolean).join("_");
    const uniqueName = `${timestamp}_${prefix}_${baseName}${ext}`;

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(uniqueName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[POST /api/upload] Supabase Storage error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 },
      );
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("uploads").getPublicUrl(uniqueName);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileUrl: publicUrl,
      fileSize: file.size,
      fileType: file.type,
    });
  } catch (err) {
    console.error("[POST /api/upload]", err);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
