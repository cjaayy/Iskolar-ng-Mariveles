import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";

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
    const barangay = searchParams.get("barangay") || undefined;

    let q = supabase
      .from("applicants")
      .select(
        `
        id,
        address,
        users!inner(full_name, email, role),
        applications(id, status)
      `,
      )
      .eq("users.role", "applicant");

    if (barangay) {
      q = q.ilike("address", `%${barangay}%`);
    }

    const { data: applicants, error: appError } = await q;
    if (appError) throw appError;

    const applicationIds: number[] = [];
    for (const applicant of applicants ?? []) {
      const apps = applicant.applications as unknown as
        | { id: number; status: string }[]
        | null;
      if (apps) {
        for (const app of apps) {
          applicationIds.push(app.id);
        }
      }
    }

    let submissions: { application_id: number; status: string }[] = [];
    if (applicationIds.length > 0) {
      const { data: subs, error: subError } = await supabase
        .from("requirement_submissions")
        .select("application_id, status")
        .in("application_id", applicationIds);
      if (subError) throw subError;
      submissions = subs ?? [];
    }

    const countsByApp: Record<
      number,
      { total: number; submitted: number; approved: number; pending: number }
    > = {};
    for (const sub of submissions) {
      if (!countsByApp[sub.application_id]) {
        countsByApp[sub.application_id] = {
          total: 0,
          submitted: 0,
          approved: 0,
          pending: 0,
        };
      }
      const c = countsByApp[sub.application_id];
      c.total++;
      if (sub.status === "approved" || sub.status === "pending") {
        c.submitted++;
      }
      if (sub.status === "approved") c.approved++;
      if (sub.status === "pending") c.pending++;
    }

    const rows = (applicants ?? []).map((applicant: Record<string, any>) => {
      const user = applicant.users as unknown as {
        full_name: string;
        email: string;
      };
      const apps = applicant.applications as unknown as
        | { id: number; status: string }[]
        | null;
      const app = apps && apps.length > 0 ? apps[0] : null;
      const counts = app ? countsByApp[app.id] : undefined;

      return {
        applicant_id: applicant.id,
        full_name: user.full_name,
        email: user.email,
        address: applicant.address,
        application_id: app?.id ?? null,
        app_status: app?.status ?? null,
        total_requirements: counts?.total ?? 0,
        submitted_requirements: counts?.submitted ?? 0,
        approved_requirements: counts?.approved ?? 0,
        pending_requirements: counts?.pending ?? 0,
      };
    });

    rows.sort((a: Record<string, any>, b: Record<string, any>) => {
      const addrCmp = (a.address || "").localeCompare(b.address || "");
      if (addrCmp !== 0) return addrCmp;
      return a.full_name.localeCompare(b.full_name);
    });

    const grouped: Record<string, typeof rows> = {};
    for (const row of rows) {
      const addr = row.address || "Unknown";
      const parts = addr.split(",");
      let brgy = "Unknown";
      const marivIdx = parts.findIndex((p: string) =>
        p.trim().toLowerCase().includes("mariveles"),
      );
      if (marivIdx > 0) {
        brgy = parts[marivIdx - 1].trim();
      } else if (parts.length >= 1) {
        brgy = parts[0].trim();
      }

      if (!grouped[brgy]) grouped[brgy] = [];
      grouped[brgy].push(row);
    }

    return NextResponse.json({ data: rows, grouped });
  } catch (err) {
    console.error("[GET /api/admin/barangay-requirements]", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
