/**
 * app/api/barangay-access/route.ts
 *
 * GET /api/barangay-access?barangay=... — public endpoint to check if a barangay is open.
 * Used by the login page and applicant pages to check access.
 */
import { NextRequest, NextResponse } from "next/server";
import { query } from "@db/connection";

export async function GET(req: NextRequest) {
  try {
    const barangay = req.nextUrl.searchParams.get("barangay");

    if (barangay) {
      // Check specific barangay
      const [row] = await query<{
        is_open: boolean;
        submission_open_date: string | null;
        submission_close_date: string | null;
      }>(
        "SELECT is_open, submission_open_date, submission_close_date FROM barangay_access WHERE barangay = :barangay LIMIT 1",
        { barangay },
      );

      const isOpen = !!row?.is_open;
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const openDate = row?.submission_open_date ?? null;
      const closeDate = row?.submission_close_date ?? null;

      // Determine if submissions are allowed:
      // - If open with NO dates set → stays open until manually closed (no expiry)
      // - If open with dates set → only open within the date window
      // - If closed with dates set → auto-open if today is within the window
      // - If closed with no dates → closed
      let submissionOpen = isOpen;

      if (openDate || closeDate) {
        // Dates are set — use the date window to determine access
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

    // Return all open barangays
    const rows = await query<{ barangay: string }>(
      "SELECT barangay FROM barangay_access WHERE is_open = 1 ORDER BY barangay ASC",
      {},
    );
    return NextResponse.json({
      openBarangays: rows.map((r) => r.barangay),
    });
  } catch (err) {
    console.error("[GET /api/barangay-access]", err);
    return NextResponse.json({ error: "Failed to check" }, { status: 500 });
  }
}
