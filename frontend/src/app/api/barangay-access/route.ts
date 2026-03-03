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
      const [row] = await query<{ is_open: boolean }>(
        "SELECT is_open FROM barangay_access WHERE barangay = :barangay LIMIT 1",
        { barangay },
      );
      return NextResponse.json({ barangay, isOpen: row?.is_open ?? false });
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
