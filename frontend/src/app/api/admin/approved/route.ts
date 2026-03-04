/**
 * app/api/admin/approved/route.ts
 *
 * GET /api/admin/approved — list all applicants whose requirements are ALL approved.
 * These are considered fully validated / approved scholars.
 * Supports ?search= for name/email filtering.
 */
import { NextRequest, NextResponse } from "next/server";
import { query } from "@db/connection";
import { REQUIREMENT_CONFIGS } from "@/config/requirements";

async function verifyAdmin(adminId: string): Promise<boolean> {
  const [user] = await query<{ role: string }>(
    `SELECT role FROM users WHERE id = :id AND role = 'admin' AND is_active = 1 LIMIT 1`,
    { id: Number(adminId) },
  );
  return !!user;
}

interface ApprovedRow {
  application_id: number;
  applicant_id: number;
  applicant_name: string;
  email: string;
  student_number: string | null;
  course: string | null;
  college: string | null;
  year_level: number | null;
  address: string | null;
  contact_number: string | null;
  submitted_at: string | null;
  approved_requirements: number;
  total_requirements: number;
}

export async function GET(req: NextRequest) {
  const adminId = req.headers.get("x-admin-id");
  if (!adminId || !(await verifyAdmin(adminId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search") || undefined;
    const totalRequired = REQUIREMENT_CONFIGS.length;

    const conditions: string[] = ["a.status != 'draft'"];
    const bind: Record<string, unknown> = { totalRequired };

    if (search) {
      conditions.push(
        "(u.full_name LIKE :search OR u.email LIKE :search OR ap.student_number LIKE :search)",
      );
      bind.search = `%${search}%`;
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const rows = await query<ApprovedRow>(
      `
      SELECT
        a.id              AS application_id,
        ap.id             AS applicant_id,
        u.full_name       AS applicant_name,
        u.email,
        ap.student_number,
        ap.course,
        ap.college,
        ap.year_level,
        ap.address,
        ap.contact_number,
        a.submitted_at,
        (SELECT COUNT(*) FROM requirement_submissions rs WHERE rs.application_id = a.id AND rs.status = 'approved') AS approved_requirements,
        ${totalRequired} AS total_requirements
      FROM applications a
      JOIN applicants   ap ON ap.id = a.applicant_id
      JOIN users         u ON u.id  = ap.user_id
      ${whereClause}
      HAVING approved_requirements = total_requirements
      ORDER BY u.full_name ASC
      `,
      bind,
    );

    return NextResponse.json({
      data: rows,
      total: rows.length,
    });
  } catch (err) {
    console.error("[GET /api/admin/approved]", err);
    return NextResponse.json(
      { error: "Failed to fetch approved applicants" },
      { status: 500 },
    );
  }
}
