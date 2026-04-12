import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";
import { REQUIREMENT_CONFIGS } from "@/config/requirements";
import { coerceId } from "@/lib/adminId";

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

async function loadApplicant(
  applicantId: string | number,
  assignedSchool: string,
) {
  const { data, error } = await supabase
    .from("applicants")
    .select("id, current_school, year_level")
    .eq("id", applicantId)
    .eq("current_school", assignedSchool)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as {
    id: number;
    current_school: string | null;
    year_level: string | null;
  };
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
  const applicant = await loadApplicant(applicantId, assignedSchool);
  if (!applicant) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  try {
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, status")
      .eq("applicant_id", applicant.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (appError) throw appError;

    if (!application) {
      const requirements = REQUIREMENT_CONFIGS.map((config, idx) => ({
        id: idx + 1,
        key: config.key,
        name: config.name,
        description: config.description,
        group: config.group,
        helpTip: config.helpTip,
        sampleUrl: config.sampleUrl ?? null,
        dueDate: config.dueDate,
        status: "missing" as const,
        progress: 0,
        uploadedFile: null,
        fileUrl: null,
        uploadedAt: null,
        notes: null,
        validatorNotes: null,
        validatedAt: null,
      }));
      return NextResponse.json({ application: null, requirements });
    }

    const { data: submissions, error: subError } = await supabase
      .from("requirement_submissions")
      .select(
        "requirement_key, status, progress, file_name, file_url, uploaded_at, notes, validator_notes, validated_at",
      )
      .eq("application_id", application.id);

    if (subError) {
      throw subError;
    }

    const subMap = Object.fromEntries(
      (submissions ?? []).map((s: Record<string, any>) => [
        s.requirement_key,
        s,
      ]),
    );

    const requirements = REQUIREMENT_CONFIGS.map((config, idx) => {
      const sub = subMap[config.key] ?? null;
      const rawStatus = sub?.status ?? "missing";
      const status =
        rawStatus === "in_progress"
          ? "in-progress"
          : (rawStatus as
              | "missing"
              | "pending"
              | "approved"
              | "rejected"
              | "in-progress");

      return {
        id: idx + 1,
        key: config.key,
        name: config.name,
        description: config.description,
        group: config.group,
        helpTip: config.helpTip,
        sampleUrl: config.sampleUrl ?? null,
        dueDate: config.dueDate,
        status,
        progress: sub?.progress ?? 0,
        uploadedFile: sub?.file_name ?? null,
        fileUrl: sub?.file_url ?? null,
        uploadedAt: sub?.uploaded_at ?? null,
        notes: sub?.notes ?? null,
        validatorNotes: sub?.validator_notes ?? null,
        validatedAt: sub?.validated_at ?? null,
      };
    });

    return NextResponse.json({ application, requirements });
  } catch (err) {
    console.error("[GET /api/encoder/students/:id/requirements]", err);
    return NextResponse.json(
      { error: "Failed to load requirements" },
      { status: 500 },
    );
  }
}

export async function POST(
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
  const applicant = await loadApplicant(applicantId, assignedSchool);
  if (!applicant) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const body = (await req.json()) as {
    requirementKey: string;
    fileName?: string;
    fileUrl?: string;
    notes?: string;
  };
  const { requirementKey, fileName, fileUrl, notes } = body;

  if (!requirementKey) {
    return NextResponse.json(
      { error: "requirementKey is required" },
      { status: 400 },
    );
  }

  try {
    const school = applicant.current_school?.trim() || "";
    const yearLevel = applicant.year_level?.trim() || "";

    const schoolLevel = school ? await getSchoolEducationLevel(school) : null;
    const yearLevelGroup = getEducationLevelFromYearLevel(yearLevel);

    if (schoolLevel && yearLevelGroup && schoolLevel !== yearLevelGroup) {
      const schoolLabel = EDUCATION_LEVEL_LABELS[schoolLevel] || schoolLevel;
      return NextResponse.json(
        {
          error: `${school} accepts ${schoolLabel} year levels only. Please update the student's year level.`,
        },
        { status: 400 },
      );
    }

    const level = getEducationLevelFromYearLevel(yearLevel);
    const otherSchoolByLevel: Record<
      string,
      "Other (Elementary)" | "Other (High School)" | "Other (Senior High)"
    > = {
      elementary: "Other (Elementary)",
      high_school: "Other (High School)",
      senior_high: "Other (Senior High)",
    };

    if (school) {
      const fetchAccess = async (schoolName: string) =>
        supabase
          .from("school_access")
          .select("is_open, submission_open_date, submission_close_date")
          .eq("school_name", schoolName)
          .limit(1)
          .maybeSingle();

      let { data: access, error: accessError } = await fetchAccess(school);

      if (!access && !accessError) {
        const normalized = normalizeSchool(school);
        if (normalized && normalized !== school) {
          const fallback = await fetchAccess(normalized);
          access = fallback.data;
          accessError = fallback.error;
        }
      }

      if (!access && !accessError && level) {
        const fallbackName = otherSchoolByLevel[level];
        const fallback = await fetchAccess(fallbackName);
        access = fallback.data;
        accessError = fallback.error;
      }

      if (accessError) {
        throw accessError;
      }

      if (access) {
        const isOpen = !!access.is_open;
        const openDate = access.submission_open_date;
        const closeDate = access.submission_close_date;
        const today = new Date().toISOString().slice(0, 10);
        const schoolLabel = school || "your school";

        if (openDate || closeDate) {
          if (openDate && today < openDate) {
            return NextResponse.json(
              {
                error: `Submissions for ${schoolLabel} will open on ${openDate}. Please come back then.`,
              },
              { status: 403 },
            );
          }
          if (closeDate && today > closeDate) {
            return NextResponse.json(
              {
                error: `The submission window for ${schoolLabel} closed on ${closeDate}.`,
              },
              { status: 403 },
            );
          }
        } else if (!isOpen) {
          return NextResponse.json(
            {
              error: `Submissions for ${schoolLabel} are currently closed. Please wait for your scheduled date.`,
            },
            { status: 403 },
          );
        }
      }
    }

    const { data: application, error: applicationError } = await supabase
      .from("applications")
      .select("id")
      .eq("applicant_id", applicant.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (applicationError) {
      throw applicationError;
    }

    let applicationId = application?.id ?? null;

    if (!applicationId) {
      const { data: inserted, error: insertError } = await supabase
        .from("applications")
        .insert({
          applicant_id: applicant.id,
          status: "submitted",
          income_at_submission: 0,
          submitted_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertError || !inserted) {
        throw insertError;
      }

      applicationId = inserted.id;
    }

    const { error: upsertError } = await supabase
      .from("requirement_submissions")
      .upsert(
        {
          application_id: applicationId,
          requirement_key: requirementKey,
          status: "pending",
          progress: 100,
          file_name: fileName ?? null,
          file_url: fileUrl ?? null,
          uploaded_at: new Date().toISOString(),
          notes: notes ?? null,
          validated_by: null,
          validated_at: null,
          validator_notes: null,
        },
        { onConflict: "application_id,requirement_key" },
      );

    if (upsertError) {
      throw upsertError;
    }

    const { error: statusError } = await supabase
      .from("applications")
      .update({ status: "under_review" })
      .eq("id", applicationId)
      .in("status", ["approved", "rejected"]);

    if (statusError) {
      throw statusError;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/encoder/students/:id/requirements]", err);
    return NextResponse.json(
      { error: "Failed to submit requirement" },
      { status: 500 },
    );
  }
}
