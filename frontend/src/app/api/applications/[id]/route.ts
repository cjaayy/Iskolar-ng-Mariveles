/**
 * app/api/applications/[id]/route.ts
 *
 * GET /api/applications/:id — fetch a single application with full details
 */
import { NextRequest, NextResponse } from "next/server";
import { query } from "@db/connection";
import type { ApplicationWithDetails } from "@db/types";

interface RouteContext {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const [application] = await query<ApplicationWithDetails>(
      `
      SELECT
        a.*,
        u.full_name     AS applicant_name,
        ap.student_number,
        ap.gpa,
        ap.year_level,
        ap.course,
        ap.college,
        ap.monthly_income,
        s.name          AS scholarship_name,
        s.grantor,
        s.min_gpa,
        s.max_monthly_income
      FROM applications a
      JOIN applicants   ap ON ap.id = a.applicant_id
      JOIN users         u ON u.id  = ap.user_id
      JOIN scholarships  s ON s.id  = a.scholarship_id
      WHERE a.id = :id
      LIMIT 1
    `,
      { id },
    );

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    // Fetch validation history
    const history = await query(
      `
      SELECT
        v.*,
        u.full_name AS validator_name
      FROM validations v
      JOIN users u ON u.id = v.validator_id
      WHERE v.application_id = :application_id
      ORDER BY v.created_at DESC
    `,
      { application_id: id },
    );

    return NextResponse.json({ data: application, history });
  } catch (err) {
    console.error("[GET /api/applications/:id]", err);
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 },
    );
  }
}
