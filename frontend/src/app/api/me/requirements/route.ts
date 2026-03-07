/**
 * app/api/me/requirements/route.ts
 *
 * GET /api/me/requirements — returns requirements merged with DB submission statuses.
 * POST /api/me/requirements — submits (upserts) a requirement document.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";
import { REQUIREMENT_CONFIGS } from "@/config/requirements";

export async function GET(req: NextRequest) {
  const applicantIdHeader = req.headers.get("x-applicant-id");
  if (!applicantIdHeader) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const applicantId = Number(applicantIdHeader);

  try {
    // Latest application for this applicant
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, status")
      .eq("applicant_id", applicantId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (appError || !application) {
      // No application yet — still show the requirement checklist (all "missing")
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

    // All submission statuses for this application
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (submissions ?? []).map((s: Record<string, any>) => [s.requirement_key, s]),
    );

    // Merge static config with DB submission data
    const requirements = REQUIREMENT_CONFIGS.map((config, idx) => {
      const sub = subMap[config.key] ?? null;
      // Normalise DB enum "in_progress" -> "in-progress" for the UI
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

/* -- POST /api/me/requirements ------------------------------------------------
   Upserts a requirement submission for the applicant's latest application.
   Body: { requirementKey: string, fileName?: string, notes?: string }
   Sets status -> "pending" (awaiting review), progress -> 100.
----------------------------------------------------------------------------- */
export async function POST(req: NextRequest) {
  const applicantIdHeader = req.headers.get("x-applicant-id");
  if (!applicantIdHeader) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const applicantId = Number(applicantIdHeader);

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
    // Check barangay access before allowing submission
    const { data: applicantInfo, error: applicantInfoError } = await supabase
      .from("applicants")
      .select("address")
      .eq("id", applicantId)
      .limit(1)
      .single();

    if (applicantInfoError) {
      throw applicantInfoError;
    }

    const address = applicantInfo?.address || "";
    const parts = address.split(",").map((p: string) => p.trim());
    const marivIdx = parts.findIndex((p: string) =>
      p.toLowerCase().includes("mariveles"),
    );
    const brgy = marivIdx > 0 ? parts[marivIdx - 1] : parts[0] || "";

    if (brgy) {
      const { data: access } = await supabase
        .from("barangay_access")
        .select("is_open, submission_open_date, submission_close_date")
        .eq("barangay", brgy)
        .limit(1)
        .single();

      if (access) {
        const isOpen = !!access.is_open;
        const openDate = access.submission_open_date;
        const closeDate = access.submission_close_date;
        const today = new Date().toISOString().slice(0, 10);

        if (openDate || closeDate) {
          // Dates are set — use date window regardless of is_open toggle
          if (openDate && today < openDate) {
            return NextResponse.json(
              {
                error: `Submissions for Barangay ${brgy} will open on ${openDate}. Please come back then.`,
              },
              { status: 403 },
            );
          }
          if (closeDate && today > closeDate) {
            return NextResponse.json(
              {
                error: `The submission window for Barangay ${brgy} closed on ${closeDate}.`,
              },
              { status: 403 },
            );
          }
        } else if (!isOpen) {
          // No dates set and manually closed
          return NextResponse.json(
            {
              error: `Submissions for Barangay ${brgy} are currently closed. Please wait for your scheduled date.`,
            },
            { status: 403 },
          );
        }
        // If open with no dates -> allowed (no expiry)
      }
    }

    // Get the applicant's latest application
    const { data: application, error: applicationError } = await supabase
      .from("applications")
      .select("id")
      .eq("applicant_id", applicantId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (applicationError || !application) {
      return NextResponse.json(
        { error: "No application found for this applicant" },
        { status: 404 },
      );
    }

    // Upsert submission row — status becomes "pending" (under review), progress = 100
    const { error: upsertError } = await supabase
      .from("requirement_submissions")
      .upsert(
        {
          application_id: application.id,
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

    // Move application back to under_review so staff knows there's new docs to review
    const { error: statusError } = await supabase
      .from("applications")
      .update({ status: "under_review" })
      .eq("id", application.id)
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
