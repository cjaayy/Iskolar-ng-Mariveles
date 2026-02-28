/**
 * app/api/me/route.ts
 *
 * GET /api/me — returns the current applicant's profile + linked scholarships.
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
  student_number: string;
  gpa: number;
  year_level: number;
  course: string;
  college: string;
  monthly_income: number;
  household_size: number;
  contact_number: string | null;
  address: string | null;
}

interface ScholarshipLink {
  name: string;
  status: string;
  grantor: string;
  app_status: string;
}

const ORDINALS = ["", "1st", "2nd", "3rd", "4th", "5th"];

function toOrdinal(n: number) {
  return (ORDINALS[n] ?? `${n}th`) + " Year";
}

function profileCompletion(row: MeRow): number {
  const checks = [
    { val: !!row.full_name, weight: 20 },
    { val: !!row.email, weight: 15 },
    { val: !!row.contact_number, weight: 15 },
    { val: !!row.address, weight: 20 },
    { val: Number(row.gpa) > 0, weight: 15 },
    { val: !!row.course, weight: 10 },
    { val: !!row.college, weight: 5 },
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
        a.student_number,
        a.gpa,
        a.year_level,
        a.course,
        a.college,
        a.monthly_income,
        a.household_size,
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

    const scholarships = await query<ScholarshipLink>(
      `
      SELECT
        s.name,
        s.grantor,
        app.status AS app_status
      FROM applications app
      JOIN scholarships s ON s.id = app.scholarship_id
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
        studentNumber: row.student_number,
        gpa: Number(row.gpa),
        yearLevel: row.year_level,
        yearLevelLabel: toOrdinal(row.year_level),
        course: row.course,
        college: row.college,
        monthlyIncome: Number(row.monthly_income),
        householdSize: row.household_size,
        contactNumber: row.contact_number,
        address: row.address,
        profileCompletion: profileCompletion(row),
      },
      scholarships: scholarships.map((s) => ({
        name: s.name,
        grantor: s.grantor,
        status: ["approved"].includes(s.app_status) ? "active" : "pending",
        award: s.grantor,
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
