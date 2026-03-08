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
    const { data: rows, error } = await supabase
      .from("barangay_access")
      .select(
        "id, barangay, is_open, submission_open_date, submission_close_date, updated_at",
      )
      .order("barangay", { ascending: true });

    if (error) throw error;

    const data = (rows ?? []).map((r: Record<string, any>) => ({
      ...r,
      is_open: !!r.is_open,
      submission_open_date: r.submission_open_date
        ? new Date(r.submission_open_date).toISOString().slice(0, 10)
        : null,
      submission_close_date: r.submission_close_date
        ? new Date(r.submission_close_date).toISOString().slice(0, 10)
        : null,
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[GET /api/admin/barangay-access]", err);
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
    const { openBarangays, submissionDates } = body as {
      openBarangays: string[];
      submissionDates?: Record<
        string,
        { open: string | null; close: string | null }
      >;
    };

    if (!Array.isArray(openBarangays)) {
      return NextResponse.json(
        { error: "openBarangays must be an array" },
        { status: 400 },
      );
    }

    const { error: closeAllError } = await supabase
      .from("barangay_access")
      .update({ is_open: false, updated_by: Number(adminId) })
      .neq("id", 0);

    if (closeAllError) throw closeAllError;

    if (openBarangays.length > 0) {
      for (const brgy of openBarangays) {
        const { error } = await supabase
          .from("barangay_access")
          .update({ is_open: true, updated_by: Number(adminId) })
          .eq("barangay", brgy);
        if (error) throw error;
      }
    }

    if (submissionDates && typeof submissionDates === "object") {
      for (const [brgy, dates] of Object.entries(submissionDates)) {
        const { error } = await supabase
          .from("barangay_access")
          .update({
            submission_open_date: dates.open || null,
            submission_close_date: dates.close || null,
            updated_by: Number(adminId),
          })
          .eq("barangay", brgy);
        if (error) throw error;
      }
    }

    return NextResponse.json({ message: "Barangay access updated" });
  } catch (err) {
    console.error("[PATCH /api/admin/barangay-access]", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
