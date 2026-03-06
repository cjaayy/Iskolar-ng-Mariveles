/**
 * app/api/admin/applicants/route.ts
 *
 * GET /api/admin/applicants — list all applicants with their user info & application status.
 * Supports ?view=applications to return application-level rows instead.
 * Admin only.
 */
import { NextRequest, NextResponse } from "next/server";
import { query } from "@db/connection";
import { REQUIREMENT_CONFIGS } from "@/config/requirements";

interface ApplicantListRow {
  user_id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  applicant_id: number;
  contact_number: string | null;
  created_at: string;
  total_applications: number;
  approved_applications: number;
}

interface ApplicationListRow {
  id: number;
  applicant_name: string;
  status: string;
  submitted_at: string | null;
  address: string | null;
  total_requirements: number;
  approved_requirements: number;
  pending_requirements: number;
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
    const view = searchParams.get("view"); // "applications" or default (applicants)
    const search = searchParams.get("search") || undefined;
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") || 20)),
    );
    const offset = (page - 1) * limit;

    // ─── Applications view ────────────────────────────────────────────
    if (view === "applications") {
      const status = searchParams.get("status") || undefined;
      const conditions: string[] = ["a.status != 'draft'"];
      const bindValues: Record<string, unknown> = { limit, offset };

      if (status && status !== "all") {
        conditions.push("a.status = :status");
        bindValues.status = status;
      }
      if (search) {
        conditions.push("(u.full_name LIKE :search)");
        bindValues.search = `%${search}%`;
      }

      const whereClause = `WHERE ${conditions.join(" AND ")}`;

      const rows = await query<ApplicationListRow>(
        `
        SELECT
          a.id,
          a.status,
          a.submitted_at,
          u.full_name       AS applicant_name,
          ap.address,
          ${REQUIREMENT_CONFIGS.length} AS total_requirements,
          (SELECT COUNT(*) FROM requirement_submissions rs WHERE rs.application_id = a.id AND rs.status = 'approved') AS approved_requirements,
          (SELECT COUNT(*) FROM requirement_submissions rs WHERE rs.application_id = a.id AND rs.status = 'pending') AS pending_requirements
        FROM applications a
        JOIN applicants   ap ON ap.id = a.applicant_id
        JOIN users         u ON u.id  = ap.user_id
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

      // Count
      const countBindValues: Record<string, unknown> = {};
      if (bindValues.status) countBindValues.status = bindValues.status;
      if (bindValues.search) countBindValues.search = bindValues.search;

      const [{ total }] = await query<{ total: number }>(
        `
        SELECT COUNT(*) AS total
        FROM applications a
        JOIN applicants   ap ON ap.id = a.applicant_id
        JOIN users         u ON u.id  = ap.user_id
        ${whereClause}
        `,
        countBindValues,
      );

      return NextResponse.json({
        data: rows,
        meta: { total, page, limit, pages: Math.ceil(total / limit) },
      });
    }

    // ─── Default: Applicants (people) view ────────────────────────────
    const conditions: string[] = [];
    const bindValues: Record<string, unknown> = { limit, offset };

    if (search) {
      conditions.push("(u.full_name LIKE :search OR u.email LIKE :search)");
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
