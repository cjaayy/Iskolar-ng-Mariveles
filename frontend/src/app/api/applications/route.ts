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

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // --- Fetch rows (JOIN for display columns) --------------------------------
    const rows = await query<ApplicationWithDetails>(
      `
      SELECT
        a.*,
        u.full_name     AS applicant_name
      FROM applications a
      JOIN applicants   ap ON ap.id   = a.applicant_id
      JOIN users         u ON u.id    = ap.user_id
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
    // --- Resolve applicant from header (simplified — replace with real auth) ----
    const applicantIdHeader = req.headers.get("x-applicant-id");
    if (!applicantIdHeader) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    const applicantId = Number(applicantIdHeader);

    // --- Load applicant -------------------------------------------------------
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

    // --- Eligibility check ---------------------------------------------------
    const eligibility = checkEligibility(applicant);
    if (!eligibility.eligible) {
      return NextResponse.json(
        { error: "Applicant is not eligible", reasons: eligibility.reasons },
        { status: 422 },
      );
    }

    // --- Prevent duplicate application ---------------------------------------
    const existing = await query(
      "SELECT id FROM applications WHERE applicant_id = :applicant_id LIMIT 1",
      { applicant_id: applicantId },
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
        (applicant_id, status, income_at_submission, submitted_at)
      VALUES
        (:applicant_id, 'submitted', :income, NOW())
    `,
      {
        applicant_id: applicantId,
        income: 0,
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
