/**
 * app/api/admin/barangay-requirements/route.ts
 *
 * GET /api/admin/barangay-requirements — per-barangay requirement submission summary.
 * Returns a list of applicants grouped by barangay with their requirement submission status.
 * Supports ?barangay= filter.
 */
import { NextRequest, NextResponse } from "next/server";
import { query } from "@db/connection";

async function verifyAdmin(adminId: string): Promise<boolean> {
  const [user] = await query<{ role: string }>(
    `SELECT role FROM users WHERE id = :id AND role = 'admin' AND is_active = 1 LIMIT 1`,
    { id: Number(adminId) },
  );
  return !!user;
}

interface RequirementRow {
  applicant_id: number;
  full_name: string;
  email: string;
  address: string | null;
  application_id: number | null;
  app_status: string | null;
  total_requirements: number;
  submitted_requirements: number;
  approved_requirements: number;
  pending_requirements: number;
}

export async function GET(req: NextRequest) {
  const adminId = req.headers.get("x-admin-id");
  if (!adminId || !(await verifyAdmin(adminId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = req.nextUrl;
    const barangay = searchParams.get("barangay") || undefined;

    const conditions: string[] = [];
    const bind: Record<string, unknown> = {};

    if (barangay) {
      conditions.push("a.address LIKE :barangay");
      bind.barangay = `%${barangay}%`;
    }

    const where =
      conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";

    const rows = await query<RequirementRow>(
      `
      SELECT
        a.id           AS applicant_id,
        u.full_name,
        u.email,
        a.address,
        app.id         AS application_id,
        app.status     AS app_status,
        COALESCE(rs_total.cnt, 0) AS total_requirements,
        COALESCE(rs_submitted.cnt, 0) AS submitted_requirements,
        COALESCE(rs_approved.cnt, 0) AS approved_requirements,
        COALESCE(rs_pending.cnt, 0) AS pending_requirements
      FROM applicants a
      JOIN users u ON u.id = a.user_id
      LEFT JOIN applications app ON app.applicant_id = a.id
      LEFT JOIN (
        SELECT application_id, COUNT(*) AS cnt
        FROM requirement_submissions
        GROUP BY application_id
      ) rs_total ON rs_total.application_id = app.id
      LEFT JOIN (
        SELECT application_id, COUNT(*) AS cnt
        FROM requirement_submissions
        WHERE status IN ('pending', 'approved')
        GROUP BY application_id
      ) rs_submitted ON rs_submitted.application_id = app.id
      LEFT JOIN (
        SELECT application_id, COUNT(*) AS cnt
        FROM requirement_submissions
        WHERE status = 'approved'
        GROUP BY application_id
      ) rs_approved ON rs_approved.application_id = app.id
      LEFT JOIN (
        SELECT application_id, COUNT(*) AS cnt
        FROM requirement_submissions
        WHERE status = 'pending'
        GROUP BY application_id
      ) rs_pending ON rs_pending.application_id = app.id
      WHERE u.role = 'applicant' ${where}
      ORDER BY a.address ASC, u.full_name ASC
      `,
      bind,
    );

    // Group by barangay
    const grouped: Record<string, typeof rows> = {};
    for (const row of rows) {
      // Extract barangay from address (first part before ", Mariveles")
      const addr = row.address || "Unknown";
      const parts = addr.split(",");
      // If address looks like "Brgy, Mariveles, Bataan" or "Street, Brgy, Mariveles, Bataan"
      // The barangay is the second-to-last before "Mariveles"
      let brgy = "Unknown";
      const marivIdx = parts.findIndex((p) =>
        p.trim().toLowerCase().includes("mariveles"),
      );
      if (marivIdx > 0) {
        brgy = parts[marivIdx - 1].trim();
      } else if (parts.length >= 1) {
        brgy = parts[0].trim();
      }

      if (!grouped[brgy]) grouped[brgy] = [];
      grouped[brgy].push(row);
    }

    return NextResponse.json({ data: rows, grouped });
  } catch (err) {
    console.error("[GET /api/admin/barangay-requirements]", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
