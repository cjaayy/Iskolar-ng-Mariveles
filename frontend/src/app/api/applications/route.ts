/**
 * app/api/applications/route.ts
 *
 * GET  /api/applications  — paginated list with optional filters
 * POST /api/applications  — submit a new application
 */
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@db/connection";
import { checkEligibility } from "@db/eligibility";
import type {
  ApplicationWithDetails,
  ApplicantRow,
  ScholarshipRow,
  CreateApplicationBody,
  GetApplicationsQuery,
} from "@db/types";

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const params: GetApplicationsQuery = {
      status:
        (searchParams.get("status") as GetApplicationsQuery["status"]) ??
        undefined,
      scholarship_id: searchParams.get("scholarship_id")
        ? Number(searchParams.get("scholarship_id"))
        : undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
    };

    // --- Validate pagination values -----------------------------------------
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const offset = (page - 1) * limit;

    // --- Build dynamic WHERE clause -----------------------------------------
    const conditions: string[] = [];
    const bindValues: Record<string, unknown> = { limit, offset };

    if (params.status) {
      conditions.push("a.status = :status");
      bindValues.status = params.status;
    }
    if (params.scholarship_id) {
      conditions.push("a.scholarship_id = :scholarship_id");
      bindValues.scholarship_id = params.scholarship_id;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // --- Fetch rows (JOIN for display columns) --------------------------------
    const rows = await query<ApplicationWithDetails>(
      `
      SELECT
        a.*,
        u.full_name     AS applicant_name,
        ap.student_number,
        s.name          AS scholarship_name,
        s.grantor
      FROM applications a
      JOIN applicants   ap ON ap.id   = a.applicant_id
      JOIN users         u ON u.id    = ap.user_id
      JOIN scholarships  s ON s.id    = a.scholarship_id
      ${whereClause}
      ORDER BY a.updated_at DESC
      LIMIT :limit OFFSET :offset
    `,
      bindValues,
    );

    // --- Count total for pagination ------------------------------------------
    const [{ total }] = await query<{ total: number }>(
      `
      SELECT COUNT(*) AS total
      FROM applications a
      ${whereClause}
    `,
      conditions.length > 0
        ? {
            status: bindValues.status,
            scholarship_id: bindValues.scholarship_id,
          }
        : {},
    );

    return NextResponse.json({
      data: rows,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[GET /api/applications]", err);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 },
    );
  }
}

// ─── POST ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // --- Parse & validate request body --------------------------------------
    let body: CreateApplicationBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { scholarship_id } = body;
    if (!scholarship_id || !Number.isInteger(Number(scholarship_id))) {
      return NextResponse.json(
        { error: "scholarship_id is required and must be an integer" },
        { status: 422 },
      );
    }

    // --- Resolve applicant from header (simplified — replace with real auth) ----
    const applicantIdHeader = req.headers.get("x-applicant-id");
    if (!applicantIdHeader) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    const applicantId = Number(applicantIdHeader);

    // --- Load applicant & scholarship ----------------------------------------
    const [applicant] = await query<ApplicantRow>(
      "SELECT * FROM applicants WHERE id = :id LIMIT 1",
      { id: applicantId },
    );
    if (!applicant) {
      return NextResponse.json(
        { error: "Applicant not found" },
        { status: 404 },
      );
    }

    const [scholarship] = await query<ScholarshipRow>(
      "SELECT * FROM scholarships WHERE id = :id AND is_active = 1 LIMIT 1",
      { id: scholarship_id },
    );
    if (!scholarship) {
      return NextResponse.json(
        { error: "Scholarship not found or inactive" },
        { status: 404 },
      );
    }

    // --- Eligibility check ---------------------------------------------------
    const eligibility = checkEligibility(applicant, scholarship);
    if (!eligibility.eligible) {
      return NextResponse.json(
        { error: "Applicant is not eligible", reasons: eligibility.reasons },
        { status: 422 },
      );
    }

    // --- Prevent duplicate application ---------------------------------------
    const existing = await query(
      "SELECT id FROM applications WHERE applicant_id = :applicant_id AND scholarship_id = :scholarship_id LIMIT 1",
      { applicant_id: applicantId, scholarship_id },
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Application already exists" },
        { status: 409 },
      );
    }

    // --- Insert application --------------------------------------------------
    const result = await execute(
      `
      INSERT INTO applications
        (applicant_id, scholarship_id, status, gpa_at_submission, income_at_submission, submitted_at)
      VALUES
        (:applicant_id, :scholarship_id, 'submitted', :gpa, :income, NOW())
    `,
      {
        applicant_id: applicantId,
        scholarship_id,
        gpa: applicant.gpa,
        income: applicant.monthly_income,
      },
    );

    return NextResponse.json(
      { id: result.insertId, message: "Application submitted successfully" },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/applications]", err);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 },
    );
  }
}
