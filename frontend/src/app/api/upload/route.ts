/**
 * app/api/upload/route.ts
 *
 * POST /api/upload — handles actual file uploads, saves to /public/uploads/
 * Returns the public URL path of the uploaded file.
 */
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
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
        { error: "File too large. Maximum size is 10MB." },
        { status: 413 },
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

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Generate a unique filename: timestamp_applicantId_requirementKey_originalname
    const ext = path.extname(file.name);
    const baseName = path
      .basename(file.name, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 60);
    const timestamp = Date.now();
    const prefix = [applicantId, requirementKey].filter(Boolean).join("_");
    const uniqueName = `${timestamp}_${prefix}_${baseName}${ext}`;

    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(UPLOAD_DIR, uniqueName);
    await writeFile(filePath, buffer);

    // Return the public URL path
    const fileUrl = `/uploads/${uniqueName}`;

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileUrl,
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
