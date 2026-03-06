/**
 * app/api/staff/barangays/route.ts
 *
 * GET /api/staff/barangays — returns applicants grouped by barangay
 * that have applications needing validation (submitted/under_review status).
 * Supports ?barangay= filter.
 */
import { NextRequest, NextResponse } from "next/server";
import { query } from "@db/connection";
import { REQUIREMENT_CONFIGS } from "@/config/requirements";

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
  const validatorId = req.headers.get("x-validator-id");
  if (!validatorId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    // Look up this validator's assigned barangay
    const [validator] = await query<{ assigned_barangay: string | null }>(
      `SELECT assigned_barangay FROM users WHERE id = :id AND role = 'validator' LIMIT 1`,
      { id: Number(validatorId) },
    );
    const assignedBarangay = validator?.assigned_barangay ?? null;

    const { searchParams } = req.nextUrl;
    const barangayFilter = searchParams.get("barangay") || undefined;

    const conditions: string[] = ["a.status != 'draft'"];
    const bindValues: Record<string, unknown> = {};

    // If validator has an assigned barangay, only show applicants from that barangay
    if (assignedBarangay) {
      conditions.push("ap.barangay = :assignedBarangay");
      bindValues.assignedBarangay = assignedBarangay;
    } else if (barangayFilter) {
      conditions.push("ap.barangay = :brgySearch");
      bindValues.brgySearch = barangayFilter;
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
      bindValues,
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
      .map(([barangay, applicants]) => ({
        barangay,
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
    console.error("[GET /api/staff/barangays]", err);
    return NextResponse.json(
      { error: "Failed to fetch barangay data" },
      { status: 500 },
    );
  }
}
