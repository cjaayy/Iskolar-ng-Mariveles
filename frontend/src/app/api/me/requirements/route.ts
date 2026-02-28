/**
 * app/api/me/requirements/route.ts
 *
 * GET /api/me/requirements — returns requirements merged with DB submission statuses.
 * POST /api/me/requirements — submits (upserts) a requirement document.
 */
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@db/connection";
import { REQUIREMENT_CONFIGS } from "@db/requirements-config";

interface ApplicationRow {
  id: number;
  status: string;
  scholarship_name: string;
  grantor: string;
}

interface SubmissionRow {
  requirement_key: string;
  status: string;
  progress: number;
  file_name: string | null;
  file_url: string | null;
  uploaded_at: Date | null;
  notes: string | null;
  validator_notes: string | null;
  validated_at: Date | null;
}

export async function GET(req: NextRequest) {
  const applicantIdHeader = req.headers.get("x-applicant-id");
  if (!applicantIdHeader) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const applicantId = Number(applicantIdHeader);

  try {
    // Latest application for this applicant
    const [application] = await query<ApplicationRow>(
      `
      SELECT
        a.id,
        a.status,
        s.name  AS scholarship_name,
        s.grantor
      FROM applications a
      JOIN scholarships s ON s.id = a.scholarship_id
      WHERE a.applicant_id = :applicant_id
      ORDER BY a.created_at DESC
      LIMIT 1
    `,
      { applicant_id: applicantId },
    );

    if (!application) {
      return NextResponse.json({ application: null, requirements: [] });
    }

    // All submission statuses for this application
    const submissions = await query<SubmissionRow>(
      `
      SELECT requirement_key, status, progress, file_name, file_url, uploaded_at, notes, validator_notes, validated_at
      FROM requirement_submissions
      WHERE application_id = :application_id
    `,
      { application_id: application.id },
    );

    const subMap = Object.fromEntries(
      submissions.map((s) => [s.requirement_key, s]),
    );

    // Merge static config with DB submission data
    const requirements = REQUIREMENT_CONFIGS.map((config, idx) => {
      const sub = subMap[config.key] ?? null;
      // Normalise DB enum "in_progress" → "in-progress" for the UI
      const rawStatus = sub?.status ?? "missing";
      const status =
        rawStatus === "in_progress"
          ? "in-progress"
          : (rawStatus as
              | "missing"
              | "pending"
              | "approved"
              | "rejected"
              | "in-progress");

      return {
        id: idx + 1,
        key: config.key,
        name: config.name,
        description: config.description,
        group: config.group,
        helpTip: config.helpTip,
        sampleUrl: config.sampleUrl ?? null,
        dueDate: config.dueDate,
        status,
        progress: sub?.progress ?? 0,
        uploadedFile: sub?.file_name ?? null,
        fileUrl: sub?.file_url ?? null,
        uploadedAt: sub?.uploaded_at ?? null,
        notes: sub?.notes ?? null,
        validatorNotes: sub?.validator_notes ?? null,
        validatedAt: sub?.validated_at ?? null,
      };
    });

    return NextResponse.json({ application, requirements });
  } catch (err) {
    console.error("[GET /api/me/requirements]", err);
    return NextResponse.json(
      { error: "Failed to load requirements" },
      { status: 500 },
    );
  }
}

/* ── POST /api/me/requirements ──────────────────────────────────────────────
   Upserts a requirement submission for the applicant's latest application.
   Body: { requirementKey: string, fileName?: string, notes?: string }
   Sets status → "pending" (awaiting review), progress → 100.
────────────────────────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const applicantIdHeader = req.headers.get("x-applicant-id");
  if (!applicantIdHeader) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const applicantId = Number(applicantIdHeader);

  const body = (await req.json()) as {
    requirementKey: string;
    fileName?: string;
    fileUrl?: string;
    notes?: string;
  };
  const { requirementKey, fileName, fileUrl, notes } = body;

  if (!requirementKey) {
    return NextResponse.json(
      { error: "requirementKey is required" },
      { status: 400 },
    );
  }

  try {
    // Get the applicant's latest application
    const [application] = await query<{ id: number }>(
      `SELECT id FROM applications
       WHERE applicant_id = :applicant_id
       ORDER BY created_at DESC
       LIMIT 1`,
      { applicant_id: applicantId },
    );

    if (!application) {
      return NextResponse.json(
        { error: "No application found for this applicant" },
        { status: 404 },
      );
    }

    // Upsert submission row — status becomes "pending" (under review), progress = 100
    await execute(
      `INSERT INTO requirement_submissions
         (application_id, requirement_key, status, progress, file_name, file_url, uploaded_at, notes)
       VALUES (:application_id, :requirement_key, 'pending', 100, :file_name, :file_url, NOW(), :notes)
       ON DUPLICATE KEY UPDATE
         status      = 'pending',
         progress    = 100,
         file_name   = VALUES(file_name),
         file_url    = VALUES(file_url),
         uploaded_at = NOW(),
         notes       = VALUES(notes),
         validated_by    = NULL,
         validated_at    = NULL,
         validator_notes = NULL`,
      {
        application_id: application.id,
        requirement_key: requirementKey,
        file_name: fileName ?? null,
        file_url: fileUrl ?? null,
        notes: notes ?? null,
      },
    );

    // Move application back to under_review so staff knows there's new docs to review
    await execute(
      `UPDATE applications SET status = 'under_review'
       WHERE id = :id AND status IN ('approved', 'rejected')`,
      { id: application.id },
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/me/requirements]", err);
    return NextResponse.json(
      { error: "Failed to submit requirement" },
      { status: 500 },
    );
  }
}
