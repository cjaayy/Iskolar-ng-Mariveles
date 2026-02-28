/**
 * app/api/staff/applications/route.ts
 *
 * GET /api/staff/applications — list all submitted applications for staff review
 * Supports filtering by status and search by applicant name / student number.
 */
import { NextRequest, NextResponse } from "next/server";
import { query } from "@db/connection";
import { REQUIREMENT_CONFIGS } from "@/config/requirements";

interface StaffApplicationRow {
  id: number;
  applicant_id: number;
  scholarship_id: number;
  status: string;
  gpa_at_submission: number | null;
  income_at_submission: number | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  remarks: string | null;
  applicant_name: string;
  student_number: string;
  scholarship_name: string;
  grantor: string;
  course: string;
  college: string;
  year_level: number;
  total_requirements: number;
  approved_requirements: number;
  pending_requirements: number;
}

export async function GET(req: NextRequest) {
  // Validate staff/validator identity
  const validatorId = req.headers.get("x-validator-id");
  if (!validatorId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") || 20)),
    );
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const bindValues: Record<string, unknown> = { limit, offset };

    // Only show submitted+ applications (not drafts)
    conditions.push("a.status != 'draft'");

    if (status && status !== "all") {
      conditions.push("a.status = :status");
      bindValues.status = status;
    }

    if (search) {
      conditions.push(
        "(u.full_name LIKE :search OR ap.student_number LIKE :search)",
      );
      bindValues.search = `%${search}%`;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows = await query<StaffApplicationRow>(
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
      bindValues,
    );

    // Count total
    const [{ total }] = await query<{ total: number }>(
      `
      SELECT COUNT(*) AS total
      FROM applications a
      JOIN applicants   ap ON ap.id = a.applicant_id
      JOIN users         u ON u.id  = ap.user_id
      ${whereClause}
      `,
      status || search
        ? { status: bindValues.status, search: bindValues.search }
        : {},
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
    console.error("[GET /api/staff/applications]", err);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 },
    );
  }
}
