import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@db/connection";
import { coerceId } from "@/lib/adminId";

interface EncoderRow {
  id: string | number;
  assigned_school: string | null;
}

const YEAR_LEVELS = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
];

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

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(8);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

function generatePlaceholderEmail(encoderId: string | number) {
  const stamp = Date.now().toString(36);
  const rand = crypto.randomBytes(3).toString("hex");
  return `student+${encoderId}-${stamp}${rand}@iskolar.local`;
}

async function verifyEncoder(encoderId: string): Promise<EncoderRow | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id, assigned_school")
    .eq("id", coerceId(encoderId))
    .eq("role", "encoder")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as EncoderRow;
}

export async function GET(req: NextRequest) {
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

  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search") || undefined;

    let q = supabase
      .from("users")
      .select(
        "id, full_name, is_active, created_at, applicants!inner(id, barangay, year_level, current_school)",
      )
      .eq("role", "applicant")
      .order("created_at", { ascending: false })
      .eq("applicants.current_school", assignedSchool);

    if (search) {
      q = q.ilike("full_name", `%${search}%`);
    }

    const { data: userRows, error: userError } = await q;
    if (userError) throw userError;

    const applicantIds = (userRows ?? [])
      .map((u: Record<string, any>) => {
        const raw = u.applicants as
          | { id?: string | number }
          | Array<{ id?: string | number }>
          | null
          | undefined;
        const applicant = Array.isArray(raw) ? raw[0] : raw;
        return applicant?.id ?? null;
      })
      .filter((id): id is string | number => id !== null && id !== undefined);

    let latestApps: Record<string, { id: number; status: string }> = {};

    if (applicantIds.length > 0) {
      const { data: apps, error: appError } = await supabase
        .from("applications")
        .select("id, applicant_id, status, created_at")
        .in("applicant_id", applicantIds)
        .order("created_at", { ascending: false });

      if (appError) throw appError;

      for (const row of apps ?? []) {
        const key = String(row.applicant_id);
        if (!latestApps[key]) {
          latestApps[key] = { id: row.id, status: row.status };
        }
      }
    }

    const rows = (userRows ?? [])
      .map((u: Record<string, any>) => {
        const raw = u.applicants as
          | {
              id?: string | number;
              barangay?: string | null;
              year_level?: string | null;
              current_school?: string | null;
            }
          | Array<{
              id?: string | number;
              barangay?: string | null;
              year_level?: string | null;
              current_school?: string | null;
            }>
          | null
          | undefined;
        const applicant = Array.isArray(raw) ? raw[0] : raw;
        if (!applicant?.id) return null;
        const appInfo = latestApps[String(applicant.id)] || null;
        return {
          user_id: u.id,
          applicant_id: applicant.id,
          full_name: u.full_name,
          is_active: u.is_active,
          barangay: applicant.barangay ?? null,
          year_level: applicant.year_level ?? null,
          current_school: applicant.current_school ?? null,
          application_id: appInfo?.id ?? null,
          application_status: appInfo?.status ?? null,
          created_at: u.created_at,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error("[GET /api/encoder/students]", err);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
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

  const { fullName, barangay, yearLevel, houseStreet, contactNumber } =
    body as {
      fullName?: string;
      barangay?: string;
      yearLevel?: string;
      houseStreet?: string;
      contactNumber?: string;
    };

  if (!fullName?.trim()) {
    return NextResponse.json(
      { error: "Full name is required" },
      { status: 400 },
    );
  }

  if (!barangay?.trim()) {
    return NextResponse.json(
      { error: "Barangay is required" },
      { status: 400 },
    );
  }

  if (!yearLevel?.trim()) {
    return NextResponse.json(
      { error: "Year level is required" },
      { status: 400 },
    );
  }

  const yearLevelValue = yearLevel.trim();

  if (!YEAR_LEVELS.includes(yearLevelValue)) {
    return NextResponse.json({ error: "Invalid year level" }, { status: 400 });
  }

  const yearLevelGroup = getEducationLevelFromYearLevel(yearLevelValue);
  const schoolLevel = await getSchoolEducationLevel(assignedSchool);

  if (schoolLevel && yearLevelGroup && schoolLevel !== yearLevelGroup) {
    const schoolLabel = EDUCATION_LEVEL_LABELS[schoolLevel] || schoolLevel;
    return NextResponse.json(
      {
        error: `${assignedSchool} accepts ${schoolLabel} year levels only. Please choose a matching year level.`,
      },
      { status: 400 },
    );
  }

  let finalEmail = generatePlaceholderEmail(encoder.id);

  for (let attempts = 0; attempts < 3; attempts += 1) {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", finalEmail)
      .limit(1)
      .maybeSingle();

    if (!existing) break;

    finalEmail = generatePlaceholderEmail(encoder.id);
    if (attempts === 2) {
      return NextResponse.json(
        { error: "Unable to generate a unique email. Try again." },
        { status: 409 },
      );
    }
  }

  const plainPassword = generatePassword();
  let hash = plainPassword;

  try {
    const bcrypt = await import("bcrypt");
    hash = await bcrypt.hash(plainPassword, 10);
  } catch {}

  const fullNameValue = fullName.trim();
  const barangayValue = barangay.trim();
  const houseStreetValue = houseStreet?.trim() || "";
  const address = houseStreetValue
    ? `${houseStreetValue}, ${barangayValue}, Mariveles, Bataan`
    : `${barangayValue}, Mariveles, Bataan`;

  try {
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        email: finalEmail,
        password_hash: hash,
        full_name: fullNameValue,
        role: "applicant",
      })
      .select("id")
      .single();

    if (userError || !user) {
      throw userError || new Error("Failed to create user");
    }

    const cleanupUser = async () => {
      await supabase.from("users").delete().eq("id", user.id);
    };

    const { data: applicant, error: applicantError } = await supabase
      .from("applicants")
      .insert({
        user_id: user.id,
        address,
        house_street: houseStreetValue || null,
        town: "Mariveles",
        barangay: barangayValue,
        current_school: assignedSchool,
        year_level: yearLevel.trim(),
        contact_number: contactNumber?.trim() || null,
      })
      .select("id")
      .single();

    if (applicantError || !applicant) {
      await cleanupUser();
      throw applicantError || new Error("Failed to create applicant");
    }

    const { data: application, error: appError } = await supabase
      .from("applications")
      .insert({ applicant_id: applicant.id, status: "submitted" })
      .select("id, status")
      .single();

    if (appError || !application) {
      await cleanupUser();
      throw appError || new Error("Failed to create application");
    }

    return NextResponse.json(
      {
        student: {
          user_id: user.id,
          applicant_id: applicant.id,
          full_name: fullNameValue,
          barangay: barangayValue,
          year_level: yearLevel.trim(),
          current_school: assignedSchool,
          application_id: application.id,
          application_status: application.status,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/encoder/students]", err);
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 },
    );
  }
}
