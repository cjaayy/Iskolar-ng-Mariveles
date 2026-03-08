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
  if (!adminId || !(await verifyAdmin(adminId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search") || undefined;
    const totalRequired = REQUIREMENT_CONFIGS.length;

    let q = supabase
      .from("applications")
      .select(
        `
        id,
        submitted_at,
        applicants!inner(
          id,
          barangay,
          contact_number,
          users!inner(full_name, email)
        )
      `,
      )
      .neq("status", "draft");

    if (search) {
      q = q.or(
        `users.full_name.ilike.%${search}%,users.email.ilike.%${search}%`,
        { referencedTable: "applicants.users" },
      );
    }

    const { data: appRows, error: appError } = await q;
    if (appError) throw appError;

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

    const approvedByApp: Record<number, number> = {};
    for (const sub of submissions) {
      if (sub.status === "approved") {
        approvedByApp[sub.application_id] =
          (approvedByApp[sub.application_id] || 0) + 1;
      }
    }

    const rows = (appRows ?? [])
      .map((r: Record<string, any>) => {
        const applicant = r.applicants as unknown as {
          id: number;
          barangay: string | null;
          contact_number: string | null;
          users: { full_name: string; email: string };
        };
        const approved = approvedByApp[r.id] || 0;
        return {
          application_id: r.id,
          applicant_id: applicant.id,
          applicant_name: applicant.users.full_name,
          email: applicant.users.email,
          barangay: applicant.barangay,
          contact_number: applicant.contact_number,
          submitted_at: r.submitted_at,
          approved_requirements: approved,
          total_requirements: totalRequired,
        };
      })
      .filter(
        (r: { approved_requirements: number; total_requirements: number }) =>
          r.approved_requirements === r.total_requirements,
      )
      .sort((a: { applicant_name: string }, b: { applicant_name: string }) =>
        a.applicant_name.localeCompare(b.applicant_name),
      );

    return NextResponse.json({
      data: rows,
      total: rows.length,
    });
  } catch (err) {
    console.error("[GET /api/admin/approved]", err);
    return NextResponse.json(
      { error: "Failed to fetch approved applicants" },
      { status: 500 },
    );
  }
}
