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
  current_school: string | null;
  year_level: string | null;
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
    const school = searchParams.get("school") || undefined;
    const educationLevel = searchParams.get("educationLevel") || undefined;

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
          year_level,
          users!inner(full_name, email)
        )
      `,
      )
      .neq("status", "draft")
      .order("updated_at", { ascending: false });

    if (school) {
      q = q.eq("applicants.current_school", school);
    }
    if (search) {
      q = q.or(
        `users.full_name.ilike.%${search}%,users.email.ilike.%${search}%`,
        { referencedTable: "applicants.users" },
      );
    }

    const { data: appRows, error: appError } = await q;
    if (appError) throw appError;

    const appIds = (appRows ?? []).map(
      (r: Record<string, unknown>) => r.id as number,
    );
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

    const rows: ApplicantRow[] = (appRows ?? []).map(
      (r: Record<string, unknown>) => {
        const applicant = r.applicants as unknown as {
          id: number;
          barangay: string | null;
          current_school: string | null;
          year_level: string | null;
          users: { full_name: string; email: string };
        };
        const counts = countsByApp[r.id as number] || {
          submitted: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
        };
        return {
          application_id: r.id as number,
          applicant_id: applicant.id,
          applicant_name: applicant.users.full_name,
          email: applicant.users.email,
          barangay: applicant.barangay,
          current_school: applicant.current_school,
          year_level: applicant.year_level,
          status: r.status as string,
          submitted_at: r.submitted_at as string | null,
          total_requirements: REQUIREMENT_CONFIGS.length,
          submitted_requirements: counts.submitted,
          approved_requirements: counts.approved,
          pending_requirements: counts.pending,
          rejected_requirements: counts.rejected,
        };
      },
    );

    // Filter by education level if specified (based on year_level)
    let filteredRows = rows;
    if (educationLevel) {
      const elementaryGrades = [
        "Grade 1",
        "Grade 2",
        "Grade 3",
        "Grade 4",
        "Grade 5",
        "Grade 6",
      ];
      const highSchoolGrades = ["Grade 7", "Grade 8", "Grade 9", "Grade 10"];
      const seniorHighGrades = ["Grade 11", "Grade 12"];

      filteredRows = rows.filter((row) => {
        if (!row.year_level) return false;
        if (educationLevel === "elementary") {
          return elementaryGrades.includes(row.year_level);
        }
        if (educationLevel === "high_school") {
          return highSchoolGrades.includes(row.year_level);
        }
        if (educationLevel === "senior_high") {
          return seniorHighGrades.includes(row.year_level);
        }
        return true;
      });
    }

    // Group by school instead of barangay
    const grouped: Record<string, ApplicantRow[]> = {};
    for (const row of filteredRows) {
      const schoolName = row.current_school || "Unknown School";
      if (!grouped[schoolName]) grouped[schoolName] = [];
      grouped[schoolName].push(row);
    }

    const schoolSummary = Object.entries(grouped)
      .map(([schoolName, applicants]) => ({
        school: schoolName,
        totalApplicants: applicants.length,
        pendingValidation: applicants.filter(
          (a) => a.pending_requirements > 0 || a.submitted_requirements === 0,
        ).length,
      }))
      .sort((a, b) => a.school.localeCompare(b.school));

    return NextResponse.json({
      grouped,
      summary: schoolSummary,
      total: filteredRows.length,
    });
  } catch (err) {
    console.error("[GET /api/admin/registered]", err);
    return NextResponse.json(
      { error: "Failed to fetch registered applicants" },
      { status: 500 },
    );
  }
}
