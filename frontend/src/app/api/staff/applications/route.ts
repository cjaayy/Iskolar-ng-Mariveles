import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";
import { REQUIREMENT_CONFIGS } from "@/config/requirements";

const STATUS_PRIORITY: Record<string, number> = {
  submitted: 1,
  under_review: 2,
  returned: 3,
  approved: 4,
  rejected: 5,
};

export async function GET(req: NextRequest) {
  const validatorId = req.headers.get("x-validator-id");
  if (!validatorId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
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
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") || 20)),
    );
    const offset = (page - 1) * limit;

    let dataQuery = supabase
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
      .neq("status", "draft")
      .order("updated_at", { ascending: false });

    let countQuery = supabase
      .from("applications")
      .select("*, applicants!inner(barangay, users!inner(full_name))", {
        count: "exact",
        head: true,
      })
      .neq("status", "draft");

    let summaryQuery = supabase
      .from("applications")
      .select("status, applicants!inner(barangay)")
      .neq("status", "draft");

    if (assignedBarangay) {
      dataQuery = dataQuery.eq("applicants.barangay", assignedBarangay);
      countQuery = countQuery.eq("applicants.barangay", assignedBarangay);
      summaryQuery = summaryQuery.eq("applicants.barangay", assignedBarangay);
    }

    if (status && status !== "all") {
      dataQuery = dataQuery.eq("status", status);
      countQuery = countQuery.eq("status", status);
    }

    if (search) {
      dataQuery = dataQuery.ilike("applicants.users.full_name", `%${search}%`);
      countQuery = countQuery.ilike(
        "applicants.users.full_name",
        `%${search}%`,
      );
    }

    const [
      { data: rows, error: dataError },
      { count: totalCount, error: countError },
      { data: summaryRows, error: summaryError },
    ] = await Promise.all([
      dataQuery.range(offset, offset + limit - 1),
      countQuery,
      summaryQuery,
    ]);

    if (dataError) throw dataError;
    if (countError) throw countError;
    if (summaryError) throw summaryError;

    const applicationIds = (rows ?? []).map(
      (r: Record<string, unknown>) => r.id as number,
    );

    const approvedMap: Record<number, number> = {};
    const pendingMap: Record<number, number> = {};

    if (applicationIds.length > 0) {
      const { data: submissions, error: subError } = await supabase
        .from("requirement_submissions")
        .select("application_id, status")
        .in("application_id", applicationIds);

      if (subError) throw subError;

      for (const sub of submissions ?? []) {
        const appId = sub.application_id as number;
        if (sub.status === "approved") {
          approvedMap[appId] = (approvedMap[appId] ?? 0) + 1;
        } else if (sub.status === "pending") {
          pendingMap[appId] = (pendingMap[appId] ?? 0) + 1;
        }
      }
    }

    const data = (rows ?? []).map((row: Record<string, unknown>) => {
      const applicants = row.applicants as {
        barangay: string | null;
        users: { full_name: string };
      };
      const appId = row.id as number;
      return {
        id: row.id,
        applicant_id: row.applicant_id,
        status: row.status,
        income_at_submission: row.income_at_submission,
        submitted_at: row.submitted_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        remarks: row.remarks,
        applicant_name: applicants?.users?.full_name ?? "",
        total_requirements: REQUIREMENT_CONFIGS.length,
        approved_requirements: approvedMap[appId] ?? 0,
        pending_requirements: pendingMap[appId] ?? 0,
      };
    });

    data.sort((a: Record<string, any>, b: Record<string, any>) => {
      const aPriority = STATUS_PRIORITY[a.status as string] ?? 6;
      const bPriority = STATUS_PRIORITY[b.status as string] ?? 6;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return (
        new Date(b.updated_at as string).getTime() -
        new Date(a.updated_at as string).getTime()
      );
    });

    const summary: Record<string, number> = {};
    for (const row of summaryRows ?? []) {
      const s = (row as Record<string, unknown>).status as string;
      summary[s] = (summary[s] ?? 0) + 1;
    }

    const total = totalCount ?? 0;

    return NextResponse.json({
      data,
      summary,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[GET /api/staff/applications]", err);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 },
    );
  }
}
