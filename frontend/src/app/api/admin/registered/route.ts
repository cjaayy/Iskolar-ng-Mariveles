/**
 * app/api/admin/registered/route.ts
 *
 * GET /api/admin/registered — list all registered applicants with their
 * application & requirement submission stats across all barangays.
 * Supports ?barangay= filter and ?search= for name/email.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";
import { REQUIREMENT_CONFIGS } from "@/config/requirements";

async function verifyAdmin(adminId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", Number(adminId))
    .eq("role", "admin")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  return !error && !!data;
}

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
  const adminId = req.headers.get("x-admin-id");
  if (!adminId || !(await verifyAdmin(adminId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search") || undefined;
    const barangay = searchParams.get("barangay") || undefined;

    // Build query
    let q = supabase
      .from("applications")
      .select(
        `
        id,
        status,
        submitted_at,
        updated_at,
        applicants!inner(
          id,
          barangay,
          users!inner(full_name, email)
        )
      `,
      )
      .neq("status", "draft")
      .order("updated_at", { ascending: false });

    if (barangay) {
      q = q.eq("applicants.barangay", barangay);
    }
    if (search) {
      q = q.or(
        `users.full_name.ilike.%${search}%,users.email.ilike.%${search}%`,
        { referencedTable: "applicants.users" },
      );
    }

    const { data: appRows, error: appError } = await q;
    if (appError) throw appError;

    // Fetch requirement submissions for all applications
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appIds = (appRows ?? []).map((r: Record<string, any>) => r.id);
    let submissions: { application_id: number; status: string }[] = [];
    if (appIds.length > 0) {
      const { data: subs, error: subError } = await supabase
        .from("requirement_submissions")
        .select("application_id, status")
        .in("application_id", appIds);
      if (subError) throw subError;
      submissions = subs ?? [];
    }

    // Compute counts per application
    const countsByApp: Record<
      number,
      {
        submitted: number;
        approved: number;
        pending: number;
        rejected: number;
      }
    > = {};
    for (const sub of submissions) {
      if (!countsByApp[sub.application_id]) {
        countsByApp[sub.application_id] = {
          submitted: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
        };
      }
      const c = countsByApp[sub.application_id];
      c.submitted++;
      if (sub.status === "approved") c.approved++;
      if (sub.status === "pending") c.pending++;
      if (sub.status === "rejected") c.rejected++;
    }

    // Build rows
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: ApplicantRow[] = (appRows ?? []).map((r: Record<string, any>) => {
      const applicant = r.applicants as unknown as {
        id: number;
        barangay: string | null;
        users: { full_name: string; email: string };
      };
      const counts = countsByApp[r.id] || {
        submitted: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
      };
      return {
        application_id: r.id,
        applicant_id: applicant.id,
        applicant_name: applicant.users.full_name,
        email: applicant.users.email,
        barangay: applicant.barangay,
        status: r.status,
        submitted_at: r.submitted_at,
        total_requirements: REQUIREMENT_CONFIGS.length,
        submitted_requirements: counts.submitted,
        approved_requirements: counts.approved,
        pending_requirements: counts.pending,
        rejected_requirements: counts.rejected,
      };
    });

    // Group by barangay
    const grouped: Record<string, ApplicantRow[]> = {};
    for (const row of rows) {
      const brgy = row.barangay || "Unknown";
      if (!grouped[brgy]) grouped[brgy] = [];
      grouped[brgy].push(row);
    }

    // Summary
    const barangaySummary = Object.entries(grouped)
      .map(([barangayName, applicants]) => ({
        barangay: barangayName,
        totalApplicants: applicants.length,
        pendingValidation: applicants.filter(
          (a) => a.pending_requirements > 0 || a.submitted_requirements === 0,
        ).length,
      }))
      .sort((a, b) => a.barangay.localeCompare(b.barangay));

    return NextResponse.json({
      grouped,
      summary: barangaySummary,
      total: rows.length,
    });
  } catch (err) {
    console.error("[GET /api/admin/registered]", err);
    return NextResponse.json(
      { error: "Failed to fetch registered applicants" },
      { status: 500 },
    );
  }
}
