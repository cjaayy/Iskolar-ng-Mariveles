/**
 * app/api/admin/applicants/route.ts
 *
 * GET /api/admin/applicants — list all applicants with their user info & application status.
 * Supports ?view=applications to return application-level rows instead.
 * Admin only.
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

export async function GET(req: NextRequest) {
  const adminId = req.headers.get("x-admin-id");
  if (!adminId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  if (!(await verifyAdmin(adminId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = req.nextUrl;
    const view = searchParams.get("view"); // "applications" or default (applicants)
    const search = searchParams.get("search") || undefined;
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") || 20)),
    );
    const offset = (page - 1) * limit;

    // ─── Applications view ────────────────────────────────────────────
    if (view === "applications") {
      const status = searchParams.get("status") || undefined;

      // Build the applications query
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
            users!inner(full_name)
          )
        `,
        )
        .neq("status", "draft");

      if (status && status !== "all") {
        q = q.eq("status", status);
      }
      if (search) {
        q = q.ilike("applicants.users.full_name", `%${search}%`);
      }

      // Count total
      let countQ = supabase
        .from("applications")
        .select(
          `
          id,
          applicants!inner(
            id,
            users!inner(full_name)
          )
        `,
          { count: "exact", head: true },
        )
        .neq("status", "draft");

      if (status && status !== "all") {
        countQ = countQ.eq("status", status);
      }
      if (search) {
        countQ = countQ.ilike("applicants.users.full_name", `%${search}%`);
      }

      const { count: total, error: countError } = await countQ;
      if (countError) throw countError;

      // Fetch paginated data -- manual sorting with status priority
      const { data: appRows, error: appError } = await q
        .order("updated_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (appError) throw appError;

      // Get all application IDs for requirement counts
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
        { approved: number; pending: number }
      > = {};
      for (const sub of submissions) {
        if (!countsByApp[sub.application_id]) {
          countsByApp[sub.application_id] = { approved: 0, pending: 0 };
        }
        if (sub.status === "approved")
          countsByApp[sub.application_id].approved++;
        if (sub.status === "pending") countsByApp[sub.application_id].pending++;
      }

      // Sort by status priority, then updated_at desc
      const statusOrder: Record<string, number> = {
        submitted: 1,
        under_review: 2,
        returned: 3,
        approved: 4,
        rejected: 5,
      };

      const rows = (appRows ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((r: Record<string, any>) => {
          const applicant = r.applicants as unknown as {
            barangay: string | null;
            users: { full_name: string };
          };
          const counts = countsByApp[r.id] || { approved: 0, pending: 0 };
          return {
            id: r.id,
            applicant_name: applicant.users.full_name,
            status: r.status,
            submitted_at: r.submitted_at,
            barangay: applicant.barangay,
            total_requirements: REQUIREMENT_CONFIGS.length,
            approved_requirements: counts.approved,
            pending_requirements: counts.pending,
          };
        })
        .sort((a: { status: string }, b: { status: string }) => {
          const sa = statusOrder[a.status] ?? 6;
          const sb = statusOrder[b.status] ?? 6;
          return sa - sb;
        });

      return NextResponse.json({
        data: rows,
        meta: {
          total: total ?? 0,
          page,
          limit,
          pages: Math.ceil((total ?? 0) / limit),
        },
      });
    }

    // ─── Default: Applicants (people) view ────────────────────────────
    let q = supabase
      .from("users")
      .select(
        `
        id,
        email,
        full_name,
        is_active,
        created_at,
        applicants!inner(
          id,
          contact_number
        )
      `,
      )
      .eq("role", "applicant")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: userRows, error: userError } = await q;
    if (userError) throw userError;

    // Count total
    let countQ = supabase
      .from("users")
      .select("id, applicants!inner(id)", { count: "exact", head: true })
      .eq("role", "applicant");

    if (search) {
      countQ = countQ.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { count: total, error: countError } = await countQ;
    if (countError) throw countError;

    // Get applicant IDs to fetch application counts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const applicantIds = (userRows ?? []).map((u: Record<string, any>) => {
      const applicant = u.applicants as unknown as { id: number };
      return applicant.id;
    });

    let applicationCounts: Record<
      number,
      { total: number; approved: number }
    > = {};

    if (applicantIds.length > 0) {
      const { data: apps, error: appsError } = await supabase
        .from("applications")
        .select("applicant_id, status")
        .in("applicant_id", applicantIds);
      if (appsError) throw appsError;

      applicationCounts = (apps ?? []).reduce(
        (
          acc: Record<number, { total: number; approved: number }>,
          row: { applicant_id: number; status: string },
        ) => {
          if (!acc[row.applicant_id]) {
            acc[row.applicant_id] = { total: 0, approved: 0 };
          }
          acc[row.applicant_id].total++;
          if (row.status === "approved") acc[row.applicant_id].approved++;
          return acc;
        },
        {},
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (userRows ?? []).map((u: Record<string, any>) => {
      const applicant = u.applicants as unknown as {
        id: number;
        contact_number: string | null;
      };
      const counts = applicationCounts[applicant.id] || {
        total: 0,
        approved: 0,
      };
      return {
        user_id: u.id,
        email: u.email,
        full_name: u.full_name,
        is_active: u.is_active,
        applicant_id: applicant.id,
        contact_number: applicant.contact_number,
        created_at: u.created_at,
        total_applications: counts.total,
        approved_applications: counts.approved,
      };
    });

    return NextResponse.json({
      data: rows,
      meta: {
        total: total ?? 0,
        page,
        limit,
        pages: Math.ceil((total ?? 0) / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/applicants]", err);
    return NextResponse.json(
      { error: "Failed to fetch applicants" },
      { status: 500 },
    );
  }
}
