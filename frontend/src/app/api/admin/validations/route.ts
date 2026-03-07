/**
 * app/api/admin/validations/route.ts
 *
 * GET  /api/admin/validations — list all submitted applications across all
 *      barangays for admin validation. Supports ?status= and ?search= filters.
 *
 * PUT  /api/admin/validations — validate a single requirement submission
 *      Body: { submissionId, action: 'approved' | 'rejected', notes?: string }
 *
 * POST /api/admin/validations — bulk-validate all pending requirements of
 *      an application at once
 *      Body: { applicationId, action: 'approved' | 'rejected', notes?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";
import { REQUIREMENT_CONFIGS } from "@/config/requirements";

async function verifyAdmin(
  adminId: string,
): Promise<{ id: number } | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", Number(adminId))
    .eq("role", "admin")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return { id: data.id };
}

// ─── GET: list applications for admin validation ─────────────────────────────

export async function GET(req: NextRequest) {
  const adminId = req.headers.get("x-admin-id");
  if (!adminId || !(await verifyAdmin(adminId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") || 50)),
    );
    const offset = (page - 1) * limit;

    // Build query
    let q = supabase
      .from("applications")
      .select(
        `
        id,
        applicant_id,
        status,
        income_at_submission,
        submitted_at,
        created_at,
        updated_at,
        remarks,
        applicants!inner(
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

    // Fetch paginated data
    const { data: appRows, error: appError } = await q
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (appError) throw appError;

    // Get requirement counts for all fetched applications
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

    const countsByApp: Record<
      number,
      { approved: number; pending: number }
    > = {};
    for (const sub of submissions) {
      if (!countsByApp[sub.application_id]) {
        countsByApp[sub.application_id] = { approved: 0, pending: 0 };
      }
      if (sub.status === "approved") countsByApp[sub.application_id].approved++;
      if (sub.status === "pending") countsByApp[sub.application_id].pending++;
    }

    // Sort by status priority
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
          applicant_id: r.applicant_id,
          status: r.status,
          income_at_submission: r.income_at_submission,
          submitted_at: r.submitted_at,
          created_at: r.created_at,
          updated_at: r.updated_at,
          remarks: r.remarks,
          applicant_name: applicant.users.full_name,
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

    // Status summary counts
    const { data: statusRows, error: statusError } = await supabase
      .from("applications")
      .select("status")
      .neq("status", "draft");

    if (statusError) throw statusError;

    const summary: Record<string, number> = {};
    for (const row of statusRows ?? []) {
      summary[row.status] = (summary[row.status] || 0) + 1;
    }

    return NextResponse.json({
      data: rows,
      summary,
      meta: {
        total: total ?? 0,
        page,
        limit,
        pages: Math.ceil((total ?? 0) / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/validations]", err);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 },
    );
  }
}

// ─── PUT: validate a single requirement ──────────────────────────────────────

export async function PUT(req: NextRequest) {
  const adminId = req.headers.get("x-admin-id");
  const admin = adminId ? await verifyAdmin(adminId) : null;
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { submissionId, action, notes } = body as {
      submissionId: number;
      action: "approved" | "rejected";
      notes?: string;
    };

    if (!submissionId || !["approved", "rejected"].includes(action)) {
      return NextResponse.json(
        {
          error:
            "submissionId and action ('approved' or 'rejected') are required",
        },
        { status: 422 },
      );
    }

    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "validate_single_requirement",
      {
        p_submission_id: submissionId,
        p_validator_id: admin.id,
        p_action: action,
        p_notes: notes ?? null,
      },
    );

    if (rpcError) throw rpcError;

    return NextResponse.json({
      message: `Document ${action} successfully`,
      submissionId,
      action,
      ...(rpcResult && typeof rpcResult === "object" ? rpcResult : {}),
    });
  } catch (err) {
    console.error("[PUT /api/admin/validations]", err);
    return NextResponse.json(
      { error: "Failed to validate document" },
      { status: 500 },
    );
  }
}

// ─── POST: bulk validate all pending requirements of an application ──────────

export async function POST(req: NextRequest) {
  const adminId = req.headers.get("x-admin-id");
  const admin = adminId ? await verifyAdmin(adminId) : null;
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { applicationId, action, notes } = body as {
      applicationId: number;
      action: "approved" | "rejected";
      notes?: string;
    };

    if (!applicationId || !["approved", "rejected"].includes(action)) {
      return NextResponse.json(
        { error: "applicationId and action are required" },
        { status: 422 },
      );
    }

    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "bulk_validate_requirements",
      {
        p_application_id: applicationId,
        p_validator_id: admin.id,
        p_action: action,
        p_notes: notes ?? null,
      },
    );

    if (rpcError) throw rpcError;

    const affected =
      rpcResult && typeof rpcResult === "object" && "affected" in rpcResult
        ? (rpcResult as { affected: number }).affected
        : 0;

    return NextResponse.json({
      message: `${affected} document(s) ${action} successfully`,
      applicationId,
      action,
      affected,
    });
  } catch (err) {
    console.error("[POST /api/admin/validations]", err);
    return NextResponse.json(
      { error: "Failed to bulk validate" },
      { status: 500 },
    );
  }
}
