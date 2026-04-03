import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";

const BASIC_INFO_COLUMNS = [
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
  "current_school",
  "year_level",
] as const;

export async function GET(req: NextRequest) {
  const applicantIdHeader = req.headers.get("x-applicant-id");
  if (!applicantIdHeader) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const applicantId = Number(applicantIdHeader);

  try {
    const { data: row, error } = await supabase
      .from("applicants")
      .select(BASIC_INFO_COLUMNS.join(", "))
      .eq("id", applicantId)
      .limit(1)
      .single();

    if (error || !row) {
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

const ALLOWED_FIELDS = new Set(BASIC_INFO_COLUMNS);

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
    const updates: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body)) {
      if (!ALLOWED_FIELDS.has(key as (typeof BASIC_INFO_COLUMNS)[number]))
        continue;
      updates[key] = value === "" ? null : value;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("applicants")
      .update(updates)
      .eq("id", applicantId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: "Basic information updated" });
  } catch (err) {
    console.error("[PUT /api/me/basic-info]", err);
    return NextResponse.json(
      { error: "Failed to update basic information" },
      { status: 500 },
    );
  }
}
