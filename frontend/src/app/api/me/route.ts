/**
 * app/api/me/route.ts
 *
 * GET /api/me — returns the current applicant's profile + application status.
 * PUT /api/me — handled in /api/me/profile/route.ts
 */
import { NextRequest, NextResponse } from "next/server";
import { query } from "@db/connection";

interface MeRow {
  user_id: number;
  email: string;
  full_name: string;
  role: string;
  applicant_id: number;
  contact_number: string | null;
  address: string | null;
}

interface ApplicationLink {
  app_status: string;
}

function profileCompletion(row: MeRow): number {
  const checks = [
    { val: !!row.full_name, weight: 25 },
    { val: !!row.email, weight: 25 },
    { val: !!row.contact_number, weight: 25 },
    { val: !!row.address, weight: 25 },
  ];
  return checks.reduce((sum, c) => sum + (c.val ? c.weight : 0), 0);
}

export async function GET(req: NextRequest) {
  const applicantIdHeader = req.headers.get("x-applicant-id");
  if (!applicantIdHeader) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const applicantId = Number(applicantIdHeader);

  try {
    const [row] = await query<MeRow>(
      `
      SELECT
        u.id            AS user_id,
        u.email,
        u.full_name,
        u.role,
        a.id            AS applicant_id,
        a.contact_number,
        a.address
      FROM applicants a
      JOIN users u ON u.id = a.user_id
      WHERE a.id = :applicant_id
      LIMIT 1
    `,
      { applicant_id: applicantId },
    );

    if (!row) {
      return NextResponse.json(
        { error: "Applicant not found" },
        { status: 404 },
      );
    }

    const nameParts = row.full_name.trim().split(/\s+/);
    const firstName = nameParts[0] ?? "";
    const lastName = nameParts.slice(1).join(" ");

    const applications = await query<ApplicationLink>(
      `
      SELECT
        app.status AS app_status
      FROM applications app
      WHERE app.applicant_id = :applicant_id
      ORDER BY app.created_at DESC
    `,
      { applicant_id: applicantId },
    );

    return NextResponse.json({
      user: {
        userId: row.user_id,
        applicantId: row.applicant_id,
        email: row.email,
        fullName: row.full_name,
        firstName,
        lastName,
        role: row.role,
        contactNumber: row.contact_number,
        address: row.address,
        profileCompletion: profileCompletion(row),
      },
      scholarships: applications.map((a) => ({
        name: "Iskolar ng Mariveles",
        grantor: "LGU Mariveles",
        status: ["approved"].includes(a.app_status) ? "active" : "pending",
        award: "LGU Mariveles",
      })),
    });
  } catch (err) {
    console.error("[GET /api/me]", err);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 },
    );
  }
}
