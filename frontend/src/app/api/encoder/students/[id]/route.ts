import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";
import { coerceId } from "@/lib/adminId";

const APPLICANT_FIELDS = [
  "id",
  "user_id",
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
  "address",
];

const UPDATE_FIELDS = new Set([
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
  "year_level",
]);

const EDUCATION_LEVEL_LABELS: Record<string, string> = {
  elementary: "Elementary",
  high_school: "High School",
  senior_high: "Senior High",
};

const normalizeSchool = (value: string) =>
  value.replace(/\s*\(.*\)\s*$/, "").trim();

const getEducationLevelFromYearLevel = (level: string) => {
  const elementary = [
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
  ];
  const highSchool = ["Grade 7", "Grade 8", "Grade 9", "Grade 10"];
  const seniorHigh = ["Grade 11", "Grade 12"];

  if (elementary.includes(level)) return "elementary";
  if (highSchool.includes(level)) return "high_school";
  if (seniorHigh.includes(level)) return "senior_high";
  return null;
};

async function getSchoolEducationLevel(schoolName: string) {
  const { data } = await supabase
    .from("school_access")
    .select("education_level")
    .eq("school_name", schoolName)
    .limit(1)
    .maybeSingle<{ education_level: string }>();

  if (data?.education_level) return data.education_level;

  const normalized = normalizeSchool(schoolName);
  if (normalized && normalized !== schoolName) {
    const { data: fallback } = await supabase
      .from("school_access")
      .select("education_level")
      .eq("school_name", normalized)
      .limit(1)
      .maybeSingle<{ education_level: string }>();
    return fallback?.education_level ?? null;
  }

  return null;
}

const parseEncoderId = (value: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") return null;
  const numeric = Number(trimmed);
  const isNumeric = Number.isFinite(numeric);
  const isUuid = /^[0-9a-fA-F-]{36}$/.test(trimmed);
  if (!isNumeric && !isUuid) return null;
  return trimmed;
};

async function verifyEncoder(encoderId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("id, assigned_school")
    .eq("id", coerceId(encoderId))
    .eq("role", "encoder")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as { id: string | number; assigned_school: string | null };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const encoderId = parseEncoderId(req.headers.get("x-encoder-id"));
  if (!encoderId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const encoder = await verifyEncoder(encoderId);
  if (!encoder) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assignedSchool = encoder.assigned_school?.trim() || null;
  if (!assignedSchool) {
    return NextResponse.json(
      { error: "Encoder has no assigned school" },
      { status: 400 },
    );
  }

  const applicantId = coerceId(params.id);

  try {
    const { data: row, error } = await supabase
      .from("applicants")
      .select(`${APPLICANT_FIELDS.join(", ")}, users!inner(full_name)`)
      .eq("id", applicantId)
      .eq("current_school", assignedSchool)
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!row) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const user = (row as Record<string, any>).users as { full_name: string };

    return NextResponse.json({
      data: {
        applicant_id: row.id,
        user_id: row.user_id,
        full_name: user?.full_name ?? "",
        date_of_birth: row.date_of_birth ?? null,
        gender: row.gender ?? null,
        contact_number: row.contact_number ?? null,
        house_street: row.house_street ?? null,
        barangay: row.barangay ?? null,
        year_level: row.year_level ?? null,
        address: row.address ?? null,
        current_school: row.current_school ?? null,
      },
    });
  } catch (err) {
    console.error("[GET /api/encoder/students/:id]", err);
    return NextResponse.json(
      { error: "Failed to load student" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const encoderId = parseEncoderId(req.headers.get("x-encoder-id"));
  if (!encoderId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const encoder = await verifyEncoder(encoderId);
  if (!encoder) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assignedSchool = encoder.assigned_school?.trim() || null;
  if (!assignedSchool) {
    return NextResponse.json(
      { error: "Encoder has no assigned school" },
      { status: 400 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const applicantId = coerceId(params.id);
  const fullName = (body.fullName as string | undefined)?.trim();

  try {
    const { data: existing, error: existingError } = await supabase
      .from("applicants")
      .select("id, user_id, barangay, house_street")
      .eq("id", applicantId)
      .eq("current_school", assignedSchool)
      .limit(1)
      .maybeSingle();

    if (existingError) throw existingError;

    if (!existing) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body)) {
      if (!UPDATE_FIELDS.has(key)) continue;
      updates[key] = value === "" ? null : value;
    }

    if ("year_level" in updates && updates.year_level) {
      const yearLevelValue = String(updates.year_level).trim();
      const yearLevelGroup = getEducationLevelFromYearLevel(yearLevelValue);
      const schoolLevel = await getSchoolEducationLevel(assignedSchool);

      if (!yearLevelGroup) {
        return NextResponse.json(
          { error: "Invalid year level" },
          { status: 400 },
        );
      }

      if (schoolLevel && schoolLevel !== yearLevelGroup) {
        const schoolLabel = EDUCATION_LEVEL_LABELS[schoolLevel] || schoolLevel;
        return NextResponse.json(
          {
            error: `${assignedSchool} accepts ${schoolLabel} year levels only. Please choose a matching year level.`,
          },
          { status: 400 },
        );
      }
    }

    const existingUserId = (existing as { user_id?: string | number | null })
      .user_id;

    if (fullName && existingUserId) {
      const { error: nameError } = await supabase
        .from("users")
        .update({ full_name: fullName })
        .eq("id", existingUserId);

      if (nameError) throw nameError;
    }

    if ("barangay" in updates || "house_street" in updates) {
      const barangayValue = String(
        updates.barangay ?? existing.barangay ?? "",
      ).trim();
      const houseStreetValue = String(
        updates.house_street ?? existing.house_street ?? "",
      ).trim();

      updates.town = barangayValue ? "Mariveles" : null;
      updates.address = barangayValue
        ? houseStreetValue
          ? `${houseStreetValue}, ${barangayValue}, Mariveles, Bataan`
          : `${barangayValue}, Mariveles, Bataan`
        : null;
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("applicants")
        .update(updates)
        .eq("id", applicantId);

      if (updateError) throw updateError;
    }

    if (!fullName && Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    return NextResponse.json({ message: "Student updated" });
  } catch (err) {
    console.error("[PUT /api/encoder/students/:id]", err);
    return NextResponse.json(
      { error: "Failed to update student" },
      { status: 500 },
    );
  }
}
