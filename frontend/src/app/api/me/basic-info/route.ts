/**
 * app/api/me/basic-info/route.ts
 *
 * GET  /api/me/basic-info — returns all basic-information fields for the applicant.
 * PUT  /api/me/basic-info — updates basic-information fields.
 */
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@db/connection";

/* ---------- Row shape coming from the DB ---------- */
interface BasicInfoRow {
  /* personal */
  date_of_birth: string | null;
  gender: string | null;
  blood_type: string | null;
  civil_status: string | null;
  maiden_name: string | null;
  spouse_name: string | null;
  spouse_occupation: string | null;
  religion: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  birthplace: string | null;
  contact_number: string | null;
  house_street: string | null;
  town: string | null;
  barangay: string | null;
  /* parents */
  father_name: string | null;
  father_occupation: string | null;
  father_contact: string | null;
  mother_name: string | null;
  mother_occupation: string | null;
  mother_contact: string | null;
  guardian_name: string | null;
  guardian_relation: string | null;
  guardian_contact: string | null;
  /* education */
  course: string;
  college: string;
  year_level: number;
  student_number: string;
  gpa: number;
  previous_school: string | null;
  previous_school_address: string | null;
  year_graduated: number | null;
  /* others */
  skills: string | null;
  hobbies: string | null;
  organizations: string | null;
  awards: string | null;
}

/* ======================== GET ======================== */
export async function GET(req: NextRequest) {
  const applicantIdHeader = req.headers.get("x-applicant-id");
  if (!applicantIdHeader) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const applicantId = Number(applicantIdHeader);

  try {
    const [row] = await query<BasicInfoRow>(
      `SELECT
         date_of_birth, gender, blood_type, civil_status,
         maiden_name, spouse_name, spouse_occupation, religion,
         height_cm, weight_kg, birthplace, contact_number,
         house_street, town, barangay,
         father_name, father_occupation, father_contact,
         mother_name, mother_occupation, mother_contact,
         guardian_name, guardian_relation, guardian_contact,
         course, college, year_level, student_number, gpa,
         previous_school, previous_school_address, year_graduated,
         skills, hobbies, organizations, awards
       FROM applicants
       WHERE id = :id
       LIMIT 1`,
      { id: applicantId },
    );

    if (!row) {
      return NextResponse.json(
        { error: "Applicant not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: row });
  } catch (err) {
    console.error("[GET /api/me/basic-info]", err);
    return NextResponse.json(
      { error: "Failed to load basic information" },
      { status: 500 },
    );
  }
}

/* ======================== PUT ======================== */

// All fields that may be updated via this endpoint
const ALLOWED_FIELDS = new Set([
  "date_of_birth",
  "gender",
  "blood_type",
  "civil_status",
  "maiden_name",
  "spouse_name",
  "spouse_occupation",
  "religion",
  "height_cm",
  "weight_kg",
  "birthplace",
  "contact_number",
  "house_street",
  "town",
  "barangay",
  "father_name",
  "father_occupation",
  "father_contact",
  "mother_name",
  "mother_occupation",
  "mother_contact",
  "guardian_name",
  "guardian_relation",
  "guardian_contact",
  "previous_school",
  "previous_school_address",
  "year_graduated",
  "skills",
  "hobbies",
  "organizations",
  "awards",
]);

export async function PUT(req: NextRequest) {
  const applicantIdHeader = req.headers.get("x-applicant-id");
  if (!applicantIdHeader) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const applicantId = Number(applicantIdHeader);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const sets: string[] = [];
    const params: Record<string, unknown> = { id: applicantId };

    for (const [key, value] of Object.entries(body)) {
      if (!ALLOWED_FIELDS.has(key)) continue;
      sets.push(`${key} = :${key}`);
      // Convert empty strings to null
      params[key] = value === "" ? null : value;
    }

    if (sets.length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    await execute(
      `UPDATE applicants SET ${sets.join(", ")} WHERE id = :id`,
      params,
    );

    return NextResponse.json({ message: "Basic information updated" });
  } catch (err) {
    console.error("[PUT /api/me/basic-info]", err);
    return NextResponse.json(
      { error: "Failed to update basic information" },
      { status: 500 },
    );
  }
}
