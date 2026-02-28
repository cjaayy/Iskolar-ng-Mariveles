/**
 * app/api/staff/applications/[id]/route.ts
 *
 * GET /api/staff/applications/:id — fetch a single application with all
 * requirement submissions + validation history for the staff review panel.
 */
import { NextRequest, NextResponse } from "next/server";
import { query } from "@db/connection";

interface RouteContext {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const validatorId = req.headers.get("x-validator-id");
  if (!validatorId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    // Application + applicant + scholarship details
    const [application] = await query(
      `
      SELECT
        a.*,
        u.full_name       AS applicant_name,
        u.email           AS applicant_email,
        ap.student_number,
        ap.gpa,
        ap.year_level,
        ap.course,
        ap.college,
        ap.monthly_income,
        ap.household_size,
        ap.contact_number,
        ap.address,
        s.name            AS scholarship_name,
        s.grantor,
        s.min_gpa,
        s.max_monthly_income,
        s.slots_available,
        s.slots_total
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

    // All requirement submissions for this application
    const requirements = await query(
      `
      SELECT
        rs.*,
        vu.full_name AS validator_name
      FROM requirement_submissions rs
      LEFT JOIN users vu ON vu.id = rs.validated_by
      WHERE rs.application_id = :application_id
      ORDER BY rs.requirement_key
      `,
      { application_id: id },
    );

    // Validation history
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

    return NextResponse.json({ data: application, requirements, history });
  } catch (err) {
    console.error("[GET /api/staff/applications/:id]", err);
    return NextResponse.json(
      { error: "Failed to fetch application details" },
      { status: 500 },
    );
  }
}
