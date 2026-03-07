/**
 * app/api/admin/registered/[id]/route.ts
 *
 * GET /api/admin/registered/:id — fetch a single application with all
 * requirement submissions + validation history for admin review (read-only).
 * Returns the same shape as the admin applicants detail endpoint.
 */
import { NextRequest, NextResponse } from "next/server";
import { query } from "@db/connection";
import { REQUIREMENT_CONFIGS } from "@/config/requirements";

interface RouteContext {
  params: { id: string };
}

async function verifyAdmin(adminId: string): Promise<boolean> {
  const [user] = await query<{ role: string }>(
    `SELECT role FROM users WHERE id = :id AND role = 'admin' AND is_active = 1 LIMIT 1`,
    { id: Number(adminId) },
  );
  return !!user;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const adminId = req.headers.get("x-admin-id");
  if (!adminId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!(await verifyAdmin(adminId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    // Application + applicant details + full basic info
    const [application] = await query(
      `
      SELECT
        a.*,
        u.full_name       AS applicant_name,
        u.email           AS applicant_email,
        ap.contact_number,
        ap.address,
        ap.date_of_birth,
        ap.gender,
        ap.blood_type,
        ap.civil_status,
        ap.maiden_name,
        ap.spouse_name,
        ap.spouse_occupation,
        ap.religion,
        ap.height_cm,
        ap.weight_kg,
        ap.birthplace,
        ap.house_street,
        ap.town,
        ap.barangay,
        ap.father_name,
        ap.father_occupation,
        ap.father_contact,
        ap.mother_name,
        ap.mother_occupation,
        ap.mother_contact,
        ap.guardian_name,
        ap.guardian_relation,
        ap.guardian_contact,
        ap.primary_school,
        ap.primary_address,
        ap.primary_year_graduated,
        ap.secondary_school,
        ap.secondary_address,
        ap.secondary_year_graduated,
        ap.tertiary_school,
        ap.tertiary_address,
        ap.tertiary_year_graduated,
        ap.tertiary_program
      FROM applications a
      JOIN applicants   ap ON ap.id = a.applicant_id
      JOIN users         u ON u.id  = ap.user_id
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
    const submissions = await query<Record<string, unknown>>(
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

    // Merge requirement configs with actual submissions
    const subMap = Object.fromEntries(
      submissions.map((s) => [s.requirement_key, s]),
    );

    const requirements = REQUIREMENT_CONFIGS.map((config, idx) => {
      const sub = subMap[config.key] ?? null;
      return {
        id: sub ? (sub.id as number) : -(idx + 1),
        application_id: id,
        requirement_key: config.key,
        status: (sub?.status as string) ?? "missing",
        progress: (sub?.progress as number) ?? 0,
        file_name: (sub?.file_name as string) ?? null,
        file_url: (sub?.file_url as string) ?? null,
        uploaded_at: (sub?.uploaded_at as string) ?? null,
        notes: (sub?.notes as string) ?? null,
        validated_by: (sub?.validated_by as number) ?? null,
        validated_at: (sub?.validated_at as string) ?? null,
        validator_notes: (sub?.validator_notes as string) ?? null,
        validator_name: (sub?.validator_name as string) ?? null,
      };
    });

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

    return NextResponse.json({
      data: application,
      requirements,
      history,
    });
  } catch (err) {
    console.error("[GET /api/admin/registered/:id]", err);
    return NextResponse.json(
      { error: "Failed to fetch application details" },
      { status: 500 },
    );
  }
}
