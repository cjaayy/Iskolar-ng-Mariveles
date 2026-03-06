/**
 * app/api/admin/registered/route.ts
 *
 * GET /api/admin/registered — list all registered applicants with their
 * application & requirement submission stats across all barangays.
 * Supports ?barangay= filter and ?search= for name/email.
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

interface ApplicantRow {
  application_id: number;
  applicant_id: number;
  applicant_name: string;
  email: string;
  barangay: string | null;
  status: string;
  submitted_at: string | null;
  total_requirements: number;
  submitted_requirements: number;
  approved_requirements: number;
  pending_requirements: number;
  rejected_requirements: number;
}

export async function GET(req: NextRequest) {
  const adminId = req.headers.get("x-admin-id");
  if (!adminId || !(await verifyAdmin(adminId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search") || undefined;
    const barangay = searchParams.get("barangay") || undefined;

    const conditions: string[] = ["a.status != 'draft'"];
    const bind: Record<string, unknown> = {};

    if (search) {
      conditions.push("(u.full_name LIKE :search OR u.email LIKE :search)");
      bind.search = `%${search}%`;
    }
    if (barangay) {
      conditions.push("ap.barangay = :barangay");
      bind.barangay = barangay;
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const rows = await query<ApplicantRow>(
      `
      SELECT
        a.id              AS application_id,
        ap.id             AS applicant_id,
        u.full_name       AS applicant_name,
        u.email,
        ap.barangay,
        a.status,
        a.submitted_at,
        ${REQUIREMENT_CONFIGS.length} AS total_requirements,
        (SELECT COUNT(*) FROM requirement_submissions rs WHERE rs.application_id = a.id) AS submitted_requirements,
        (SELECT COUNT(*) FROM requirement_submissions rs WHERE rs.application_id = a.id AND rs.status = 'approved') AS approved_requirements,
        (SELECT COUNT(*) FROM requirement_submissions rs WHERE rs.application_id = a.id AND rs.status = 'pending') AS pending_requirements,
        (SELECT COUNT(*) FROM requirement_submissions rs WHERE rs.application_id = a.id AND rs.status = 'rejected') AS rejected_requirements
      FROM applications a
      JOIN applicants   ap ON ap.id = a.applicant_id
      JOIN users         u ON u.id  = ap.user_id
      ${whereClause}
      ORDER BY a.updated_at DESC
      `,
      bind,
    );

    // Group by barangay
    const grouped: Record<string, ApplicantRow[]> = {};
    for (const row of rows) {
      const brgy = row.barangay || "Unknown";
      if (!grouped[brgy]) grouped[brgy] = [];
      grouped[brgy].push(row);
    }

    // Summary
    const barangaySummary = Object.entries(grouped)
      .map(([barangayName, applicants]) => ({
        barangay: barangayName,
        totalApplicants: applicants.length,
        pendingValidation: applicants.filter(
          (a) => a.pending_requirements > 0 || a.submitted_requirements === 0,
        ).length,
      }))
      .sort((a, b) => a.barangay.localeCompare(b.barangay));

    return NextResponse.json({
      grouped,
      summary: barangaySummary,
      total: rows.length,
    });
  } catch (err) {
    console.error("[GET /api/admin/registered]", err);
    return NextResponse.json(
      { error: "Failed to fetch registered applicants" },
      { status: 500 },
    );
  }
}
