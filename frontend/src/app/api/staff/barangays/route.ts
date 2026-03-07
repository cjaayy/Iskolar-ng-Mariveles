/**
 * app/api/staff/barangays/route.ts
 *
 * GET /api/staff/barangays — returns applicants grouped by barangay
 * that have applications needing validation (submitted/under_review status).
 * Supports ?barangay= filter.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";
import { REQUIREMENT_CONFIGS } from "@/config/requirements";

interface ApplicantRow {
  application_id: number;
  applicant_id: number;
  applicant_name: string;
  email: string;
  barangay: string | null;
  status: string;
  submitted_at: string | null;
  total_requirements: number;
  submitted_requirements: number;
  approved_requirements: number;
  pending_requirements: number;
  rejected_requirements: number;
}

export async function GET(req: NextRequest) {
  const validatorId = req.headers.get("x-validator-id");
  if (!validatorId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    // Look up this validator's assigned barangay
    const { data: validator, error: valError } = await supabase
      .from("users")
      .select("assigned_barangay")
      .eq("id", Number(validatorId))
      .eq("role", "validator")
      .limit(1)
      .maybeSingle();

    if (valError) throw valError;
    const assignedBarangay = validator?.assigned_barangay ?? null;

    const { searchParams } = req.nextUrl;
    const barangayFilter = searchParams.get("barangay") || undefined;

    // ── Build query ───────────────────────────────────────────────────────────
    let dataQuery = supabase
      .from("applications")
      .select(
        `
        id,
        applicant_id,
        status,
        submitted_at,
        applicants!inner(
          id,
          barangay,
          users!inner(full_name, email)
        )
      `,
      )
      .neq("status", "draft")
      .order("updated_at", { ascending: false });

    // Filter by assigned barangay or by query param
    if (assignedBarangay) {
      dataQuery = dataQuery.eq("applicants.barangay", assignedBarangay);
    } else if (barangayFilter) {
      dataQuery = dataQuery.eq("applicants.barangay", barangayFilter);
    }

    const { data: rows, error: dataError } = await dataQuery;
    if (dataError) throw dataError;

    const applicationIds = (rows ?? []).map(
      (r: Record<string, unknown>) => r.id as number,
    );

    // ── Fetch requirement submissions and compute counts in JS ────────────
    const submissionsByApp: Record<
      number,
      { submitted: number; approved: number; pending: number; rejected: number }
    > = {};

    if (applicationIds.length > 0) {
      const { data: submissions, error: subError } = await supabase
        .from("requirement_submissions")
        .select("application_id, status")
        .in("application_id", applicationIds);

      if (subError) throw subError;

      for (const sub of submissions ?? []) {
        const appId = sub.application_id as number;
        if (!submissionsByApp[appId]) {
          submissionsByApp[appId] = {
            submitted: 0,
            approved: 0,
            pending: 0,
            rejected: 0,
          };
        }
        submissionsByApp[appId].submitted += 1;
        if (sub.status === "approved") submissionsByApp[appId].approved += 1;
        else if (sub.status === "pending") submissionsByApp[appId].pending += 1;
        else if (sub.status === "rejected")
          submissionsByApp[appId].rejected += 1;
      }
    }

    // ── Flatten and merge ─────────────────────────────────────────────────────
    const flatRows: ApplicantRow[] = (rows ?? []).map(
      (row: Record<string, unknown>) => {
        const applicants = row.applicants as {
          id: number;
          barangay: string | null;
          users: { full_name: string; email: string };
        };
        const appId = row.id as number;
        const counts = submissionsByApp[appId] ?? {
          submitted: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
        };

        return {
          application_id: appId,
          applicant_id: applicants.id,
          applicant_name: applicants.users.full_name,
          email: applicants.users.email,
          barangay: applicants.barangay,
          status: row.status as string,
          submitted_at: row.submitted_at as string | null,
          total_requirements: REQUIREMENT_CONFIGS.length,
          submitted_requirements: counts.submitted,
          approved_requirements: counts.approved,
          pending_requirements: counts.pending,
          rejected_requirements: counts.rejected,
        };
      },
    );

    // Group by barangay
    const grouped: Record<string, ApplicantRow[]> = {};
    for (const row of flatRows) {
      const brgy = row.barangay || "Unknown";
      if (!grouped[brgy]) grouped[brgy] = [];
      grouped[brgy].push(row);
    }

    // Summary
    const barangaySummary = Object.entries(grouped)
      .map(([barangay, applicants]) => ({
        barangay,
        totalApplicants: applicants.length,
        pendingValidation: applicants.filter(
          (a) => a.pending_requirements > 0 || a.submitted_requirements === 0,
        ).length,
      }))
      .sort((a, b) => a.barangay.localeCompare(b.barangay));

    return NextResponse.json({
      grouped,
      summary: barangaySummary,
      total: flatRows.length,
    });
  } catch (err) {
    console.error("[GET /api/staff/barangays]", err);
    return NextResponse.json(
      { error: "Failed to fetch barangay data" },
      { status: 500 },
    );
  }
}
