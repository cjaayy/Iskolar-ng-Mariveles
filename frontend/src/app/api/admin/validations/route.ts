/**
 * app/api/admin/validations/route.ts
 *
 * GET  /api/admin/validations — list all submitted applications across all
 *      barangays for admin validation. Supports ?status= and ?search= filters.
 *
 * PUT  /api/admin/validations — validate a single requirement submission
 *      Body: { submissionId, action: 'approved' | 'rejected', notes?: string }
 *
 * POST /api/admin/validations — bulk-validate all pending requirements of
 *      an application at once
 *      Body: { applicationId, action: 'approved' | 'rejected', notes?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@db/connection";
import { REQUIREMENT_CONFIGS } from "@/config/requirements";

async function verifyAdmin(adminId: string): Promise<{ id: number } | null> {
  const [user] = await query<{ id: number; role: string }>(
    `SELECT id, role FROM users WHERE id = :id AND role = 'admin' AND is_active = 1 LIMIT 1`,
    { id: Number(adminId) },
  );
  return user ?? null;
}

// ─── GET: list applications for admin validation ─────────────────────────────

export async function GET(req: NextRequest) {
  const adminId = req.headers.get("x-admin-id");
  if (!adminId || !(await verifyAdmin(adminId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") || 50)),
    );
    const offset = (page - 1) * limit;

    const conditions: string[] = ["a.status != 'draft'"];
    const bind: Record<string, unknown> = { limit, offset };

    if (status && status !== "all") {
      conditions.push("a.status = :status");
      bind.status = status;
    }
    if (search) {
      conditions.push(
        "(u.full_name LIKE :search OR ap.student_number LIKE :search)",
      );
      bind.search = `%${search}%`;
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const rows = await query(
      `
      SELECT
        a.id,
        a.applicant_id,
        a.scholarship_id,
        a.status,
        a.gpa_at_submission,
        a.income_at_submission,
        a.submitted_at,
        a.created_at,
        a.updated_at,
        a.remarks,
        u.full_name       AS applicant_name,
        ap.student_number,
        ap.course,
        ap.college,
        ap.year_level,
        ap.address,
        s.name            AS scholarship_name,
        s.grantor,
        ${REQUIREMENT_CONFIGS.length} AS total_requirements,
        (SELECT COUNT(*) FROM requirement_submissions rs WHERE rs.application_id = a.id AND rs.status = 'approved') AS approved_requirements,
        (SELECT COUNT(*) FROM requirement_submissions rs WHERE rs.application_id = a.id AND rs.status = 'pending') AS pending_requirements
      FROM applications a
      JOIN applicants   ap ON ap.id = a.applicant_id
      JOIN users         u ON u.id  = ap.user_id
      JOIN scholarships  s ON s.id  = a.scholarship_id
      ${whereClause}
      ORDER BY
        CASE a.status
          WHEN 'submitted' THEN 1
          WHEN 'under_review' THEN 2
          WHEN 'returned' THEN 3
          WHEN 'approved' THEN 4
          WHEN 'rejected' THEN 5
          ELSE 6
        END,
        a.updated_at DESC
      LIMIT :limit OFFSET :offset
      `,
      bind,
    );

    // Count total
    const countBind: Record<string, unknown> = {};
    if (bind.status) countBind.status = bind.status;
    if (bind.search) countBind.search = bind.search;

    const [{ total }] = await query<{ total: number }>(
      `
      SELECT COUNT(*) AS total
      FROM applications a
      JOIN applicants   ap ON ap.id = a.applicant_id
      JOIN users         u ON u.id  = ap.user_id
      ${whereClause}
      `,
      countBind,
    );

    // Status summary counts
    const statusCounts = await query<{ status: string; count: number }>(
      `
      SELECT a.status, COUNT(*) AS count
      FROM applications a
      WHERE a.status != 'draft'
      GROUP BY a.status
      `,
    );
    const summary = Object.fromEntries(
      statusCounts.map((r) => [r.status, Number(r.count)]),
    );

    return NextResponse.json({
      data: rows,
      summary,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[GET /api/admin/validations]", err);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 },
    );
  }
}

// ─── PUT: validate a single requirement ──────────────────────────────────────

export async function PUT(req: NextRequest) {
  const adminId = req.headers.get("x-admin-id");
  const admin = adminId ? await verifyAdmin(adminId) : null;
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { submissionId, action, notes } = body as {
      submissionId: number;
      action: "approved" | "rejected";
      notes?: string;
    };

    if (!submissionId || !["approved", "rejected"].includes(action)) {
      return NextResponse.json(
        {
          error:
            "submissionId and action ('approved' or 'rejected') are required",
        },
        { status: 422 },
      );
    }

    const [submission] = await query<{
      id: number;
      application_id: number;
      status: string;
    }>(
      "SELECT id, application_id, status FROM requirement_submissions WHERE id = :id LIMIT 1",
      { id: submissionId },
    );

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 },
      );
    }

    await execute(
      `UPDATE requirement_submissions
       SET status = :status,
           validated_by = :validator_id,
           validated_at = NOW(),
           validator_notes = :notes
       WHERE id = :id`,
      {
        status: action,
        validator_id: admin.id,
        notes: notes ?? null,
        id: submissionId,
      },
    );

    // Check if all requirements approved → auto-approve application
    const [counts] = await query<{
      total: number;
      approved: number;
    }>(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved
       FROM requirement_submissions
       WHERE application_id = :application_id`,
      { application_id: submission.application_id },
    );

    if (
      counts &&
      Number(counts.total) > 0 &&
      Number(counts.approved) === Number(counts.total)
    ) {
      await execute(
        "UPDATE applications SET status = 'approved', remarks = 'All documents validated by admin' WHERE id = :id AND status IN ('submitted', 'under_review')",
        { id: submission.application_id },
      );
    } else if (action === "rejected") {
      await execute(
        "UPDATE applications SET status = 'under_review' WHERE id = :id AND status = 'submitted'",
        { id: submission.application_id },
      );
    }

    return NextResponse.json({
      message: `Document ${action} successfully`,
      submissionId,
      action,
    });
  } catch (err) {
    console.error("[PUT /api/admin/validations]", err);
    return NextResponse.json(
      { error: "Failed to validate document" },
      { status: 500 },
    );
  }
}

// ─── POST: bulk validate all pending requirements of an application ──────────

export async function POST(req: NextRequest) {
  const adminId = req.headers.get("x-admin-id");
  const admin = adminId ? await verifyAdmin(adminId) : null;
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { applicationId, action, notes } = body as {
      applicationId: number;
      action: "approved" | "rejected";
      notes?: string;
    };

    if (!applicationId || !["approved", "rejected"].includes(action)) {
      return NextResponse.json(
        { error: "applicationId and action are required" },
        { status: 422 },
      );
    }

    const result = await execute(
      `UPDATE requirement_submissions
       SET status = :status,
           validated_by = :validator_id,
           validated_at = NOW(),
           validator_notes = :notes
       WHERE application_id = :application_id
         AND status = 'pending'`,
      {
        status: action,
        validator_id: admin.id,
        notes: notes ?? null,
        application_id: applicationId,
      },
    );

    const newAppStatus = action === "approved" ? "approved" : "under_review";
    await execute(
      "UPDATE applications SET status = :status, remarks = :remarks WHERE id = :id",
      {
        status: newAppStatus,
        remarks:
          notes ??
          (action === "approved"
            ? "All documents approved by admin"
            : "Documents need revision"),
        id: applicationId,
      },
    );

    await execute(
      `INSERT INTO validations (application_id, validator_id, action, notes)
       VALUES (:application_id, :validator_id, :action, :notes)`,
      {
        application_id: applicationId,
        validator_id: admin.id,
        action,
        notes: notes ?? null,
      },
    );

    return NextResponse.json({
      message: `${result.affectedRows} document(s) ${action} successfully`,
      applicationId,
      action,
      affected: result.affectedRows,
    });
  } catch (err) {
    console.error("[POST /api/admin/validations]", err);
    return NextResponse.json(
      { error: "Failed to bulk validate" },
      { status: 500 },
    );
  }
}
