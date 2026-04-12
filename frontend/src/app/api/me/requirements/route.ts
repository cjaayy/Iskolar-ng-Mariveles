import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";
import { REQUIREMENT_CONFIGS } from "@/config/requirements";
import { coerceId } from "@/lib/adminId";

export async function GET(req: NextRequest) {
  const applicantIdHeader = req.headers.get("x-applicant-id");
  if (!applicantIdHeader) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const applicantId = coerceId(applicantIdHeader);

  try {
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, status")
      .eq("applicant_id", applicantId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (appError || !application) {
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
    console.error("[GET /api/me/requirements]", err);
    return NextResponse.json(
      { error: "Failed to load requirements" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const applicantIdHeader = req.headers.get("x-applicant-id");
  if (!applicantIdHeader) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const applicantId = coerceId(applicantIdHeader);

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
    const { data: applicantInfo, error: applicantInfoError } = await supabase
      .from("applicants")
      .select("current_school, year_level")
      .eq("id", applicantId)
      .limit(1)
      .single();

    if (applicantInfoError) {
      throw applicantInfoError;
    }

    const school = applicantInfo?.current_school?.trim() || "";
    const yearLevel = applicantInfo?.year_level?.trim() || "";

    const getEducationLevel = (level: string) => {
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

    const level = getEducationLevel(yearLevel);
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
        const normalized = school.replace(/\s*\(.*\)\s*$/, "").trim();
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
      .eq("applicant_id", applicantId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (applicationError) {
      throw applicationError;
    }

    let applicationId = application?.id ?? null;

    if (!applicationId) {
      const { data: applicant, error: applicantError } = await supabase
        .from("applicants")
        .select("id")
        .eq("id", applicantId)
        .limit(1)
        .maybeSingle();

      if (applicantError || !applicant) {
        return NextResponse.json(
          { error: "Applicant not found" },
          { status: 404 },
        );
      }

      const { data: inserted, error: insertError } = await supabase
        .from("applications")
        .insert({
          applicant_id: applicantId,
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
    console.error("[POST /api/me/requirements]", err);
    return NextResponse.json(
      { error: "Failed to submit requirement" },
      { status: 500 },
    );
  }
}
