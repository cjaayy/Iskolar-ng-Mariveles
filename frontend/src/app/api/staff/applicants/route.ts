import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";
import { coerceId } from "@/lib/adminId";
import { REQUIREMENT_CONFIGS } from "@/config/requirements";

async function verifyValidator(validatorId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("id, assigned_school")
    .eq("id", coerceId(validatorId))
    .eq("role", "validator")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as { id: string | number; assigned_school: string | null };
}

export async function GET(req: NextRequest) {
  const validatorId = req.headers.get("x-validator-id");
  if (!validatorId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const validator = await verifyValidator(validatorId);
  if (!validator) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = req.nextUrl;
    const view = searchParams.get("view");
    const search = searchParams.get("search") || undefined;
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") || 20)),
    );
    const offset = (page - 1) * limit;

    const assignedSchool = validator.assigned_school ?? null;

    if (view === "applications") {
      const status = searchParams.get("status") || undefined;

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
            current_school,
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

      if (assignedSchool) {
        q = q.eq("applicants.current_school", assignedSchool);
        countQ = countQ.eq("applicants.current_school", assignedSchool);
      }

      const { count: total, error: countError } = await countQ;
      if (countError) throw countError;

      const { data: appRows, error: appError } = await q
        .order("updated_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (appError) throw appError;

      const appIds = (appRows ?? []).map((r: Record<string, any>) => r.id);
      let submissions: { application_id: string | number; status: string }[] =
        [];
      if (appIds.length > 0) {
        const { data: subs, error: subError } = await supabase
          .from("requirement_submissions")
          .select("application_id, status")
          .in("application_id", appIds);
        if (subError) throw subError;
        submissions = subs ?? [];
      }

      const countsByApp: Record<string, { approved: number; pending: number }> =
        {};
      for (const sub of submissions) {
        const key = String(sub.application_id);
        if (!countsByApp[key]) {
          countsByApp[key] = { approved: 0, pending: 0 };
        }
        if (sub.status === "approved") countsByApp[key].approved++;
        if (sub.status === "pending") countsByApp[key].pending++;
      }

      const statusOrder: Record<string, number> = {
        submitted: 1,
        under_review: 2,
        returned: 3,
        approved: 4,
        rejected: 5,
      };

      const rows = (appRows ?? [])
        .map((r: Record<string, any>) => {
          const applicant = r.applicants as unknown as {
            barangay: string | null;
            current_school: string | null;
            users: { full_name: string };
          };
          const counts = countsByApp[String(r.id)] || {
            approved: 0,
            pending: 0,
          };
          return {
            id: r.id,
            applicant_name: applicant.users.full_name,
            status: r.status,
            submitted_at: r.submitted_at,
            barangay: applicant.barangay,
            school: applicant.current_school,
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
          contact_number,
          current_school
        )
      `,
      )
      .eq("role", "applicant")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (assignedSchool) {
      q = q.eq("applicants.current_school", assignedSchool);
    }

    const { data: userRows, error: userError } = await q;
    if (userError) throw userError;

    let countQ = supabase
      .from("users")
      .select("id, applicants!inner(id, current_school)", {
        count: "exact",
        head: true,
      })
      .eq("role", "applicant");

    if (search) {
      countQ = countQ.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (assignedSchool) {
      countQ = countQ.eq("applicants.current_school", assignedSchool);
    }

    const { count: total, error: countError } = await countQ;
    if (countError) throw countError;

    const applicantIds = (userRows ?? []).map((u: Record<string, any>) => {
      const applicant = u.applicants as unknown as { id: string | number };
      return applicant.id;
    });

    let applicationCounts: Record<string, { total: number; approved: number }> =
      {};

    if (applicantIds.length > 0) {
      const { data: apps, error: appsError } = await supabase
        .from("applications")
        .select("applicant_id, status")
        .in("applicant_id", applicantIds);
      if (appsError) throw appsError;

      applicationCounts = (apps ?? []).reduce(
        (
          acc: Record<string, { total: number; approved: number }>,
          row: { applicant_id: string | number; status: string },
        ) => {
          const key = String(row.applicant_id);
          if (!acc[key]) {
            acc[key] = { total: 0, approved: 0 };
          }
          acc[key].total++;
          if (row.status === "approved") acc[key].approved++;
          return acc;
        },
        {},
      );
    }

    const rows = (userRows ?? []).map((u: Record<string, any>) => {
      const applicant = u.applicants as unknown as {
        id: string | number;
        contact_number: string | null;
      };
      const counts = applicationCounts[String(applicant.id)] || {
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
    console.error("[GET /api/staff/applicants]", err);
    return NextResponse.json(
      { error: "Failed to fetch applicants" },
      { status: 500 },
    );
  }
}
