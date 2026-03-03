/**
 * app/api/admin/applicants/route.ts
 *
 * GET /api/admin/applicants — list all applicants with their user info & application status.
 * Admin only.
 */
import { NextRequest, NextResponse } from "next/server";
import { query } from "@db/connection";

interface ApplicantListRow {
  user_id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  applicant_id: number;
  student_number: string;
  gpa: number;
  year_level: number;
  course: string;
  college: string;
  monthly_income: number;
  contact_number: string | null;
  created_at: string;
  total_applications: number;
  approved_applications: number;
}

async function verifyAdmin(adminId: string): Promise<boolean> {
  const [user] = await query<{ role: string }>(
    `SELECT role FROM users WHERE id = :id AND role = 'admin' AND is_active = 1 LIMIT 1`,
    { id: Number(adminId) },
  );
  return !!user;
}

export async function GET(req: NextRequest) {
  const adminId = req.headers.get("x-admin-id");
  if (!adminId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  if (!(await verifyAdmin(adminId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search") || undefined;
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") || 20)),
    );
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const bindValues: Record<string, unknown> = { limit, offset };

    if (search) {
      conditions.push(
        "(u.full_name LIKE :search OR u.email LIKE :search OR a.student_number LIKE :search)",
      );
      bindValues.search = `%${search}%`;
    }

    const whereClause =
      conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";

    const rows = await query<ApplicantListRow>(
      `
      SELECT
        u.id            AS user_id,
        u.email,
        u.full_name,
        u.is_active,
        a.id            AS applicant_id,
        a.student_number,
        a.gpa,
        a.year_level,
        a.course,
        a.college,
        a.monthly_income,
        a.contact_number,
        u.created_at,
        (SELECT COUNT(*) FROM applications ap WHERE ap.applicant_id = a.id) AS total_applications,
        (SELECT COUNT(*) FROM applications ap WHERE ap.applicant_id = a.id AND ap.status = 'approved') AS approved_applications
      FROM users u
      JOIN applicants a ON a.user_id = u.id
      WHERE u.role = 'applicant' ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT :limit OFFSET :offset
      `,
      bindValues,
    );

    const [{ total }] = await query<{ total: number }>(
      `
      SELECT COUNT(*) AS total
      FROM users u
      JOIN applicants a ON a.user_id = u.id
      WHERE u.role = 'applicant' ${whereClause}
      `,
      search ? { search: bindValues.search } : {},
    );

    return NextResponse.json({
      data: rows,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[GET /api/admin/applicants]", err);
    return NextResponse.json(
      { error: "Failed to fetch applicants" },
      { status: 500 },
    );
  }
}
