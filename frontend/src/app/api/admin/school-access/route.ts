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
    const url = new URL(req.url);
    const educationLevel = url.searchParams.get("educationLevel");

    let query = supabase
      .from("school_access")
      .select(
        "id, school_name, education_level, is_open, submission_open_date, submission_close_date, updated_at",
      )
      .order("education_level", { ascending: true })
      .order("school_name", { ascending: true });

    if (educationLevel) {
      query = query.eq("education_level", educationLevel);
    }

    const { data: rows, error } = await query;

    if (error) throw error;

    const data = (rows ?? []).map((r: Record<string, unknown>) => ({
      ...r,
      is_open: !!r.is_open,
      submission_open_date: r.submission_open_date
        ? new Date(r.submission_open_date as string).toISOString().slice(0, 10)
        : null,
      submission_close_date: r.submission_close_date
        ? new Date(r.submission_close_date as string).toISOString().slice(0, 10)
        : null,
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[GET /api/admin/school-access]", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const adminId = req.headers.get("x-admin-id");
  if (!adminId || !(await verifyAdmin(adminId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { openSchools, submissionDates } = body as {
      openSchools: string[];
      submissionDates?: Record<
        string,
        { open: string | null; close: string | null }
      >;
    };

    if (!Array.isArray(openSchools)) {
      return NextResponse.json(
        { error: "openSchools must be an array" },
        { status: 400 },
      );
    }

    // Close all schools first
    const { error: closeAllError } = await supabase
      .from("school_access")
      .update({ is_open: false, updated_by: Number(adminId) })
      .neq("id", 0);

    if (closeAllError) throw closeAllError;

    // Open selected schools
    if (openSchools.length > 0) {
      for (const school of openSchools) {
        const { error } = await supabase
          .from("school_access")
          .update({ is_open: true, updated_by: Number(adminId) })
          .eq("school_name", school);
        if (error) throw error;
      }
    }

    // Update submission dates
    if (submissionDates && typeof submissionDates === "object") {
      for (const [school, dates] of Object.entries(submissionDates)) {
        const { error } = await supabase
          .from("school_access")
          .update({
            submission_open_date: dates.open || null,
            submission_close_date: dates.close || null,
            updated_by: Number(adminId),
          })
          .eq("school_name", school);
        if (error) throw error;
      }
    }

    return NextResponse.json({ message: "School access updated" });
  } catch (err) {
    console.error("[PATCH /api/admin/school-access]", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
