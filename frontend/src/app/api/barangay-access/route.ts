import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const barangay = req.nextUrl.searchParams.get("barangay");

    if (barangay) {
      const { data: row, error } = await supabase
        .from("barangay_access")
        .select("is_open, submission_open_date, submission_close_date")
        .eq("barangay", barangay)
        .maybeSingle();

      if (error) throw error;

      const isOpen = !!row?.is_open;
      const today = new Date().toISOString().slice(0, 10);
      const openDate = row?.submission_open_date ?? null;
      const closeDate = row?.submission_close_date ?? null;

      let submissionOpen = isOpen;

      if (openDate || closeDate) {
        const afterOpen = !openDate || today >= openDate;
        const beforeClose = !closeDate || today <= closeDate;
        submissionOpen = afterOpen && beforeClose;
      }

      return NextResponse.json({
        barangay,
        isOpen,
        submissionOpen,
        submissionOpenDate: openDate,
        submissionCloseDate: closeDate,
      });
    }

    const { data: rows, error } = await supabase
      .from("barangay_access")
      .select("barangay")
      .eq("is_open", true)
      .order("barangay", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      openBarangays: (rows ?? []).map((r: Record<string, any>) => r.barangay),
    });
  } catch (err) {
    console.error("[GET /api/barangay-access]", err);
    return NextResponse.json({ error: "Failed to check" }, { status: 500 });
  }
}
