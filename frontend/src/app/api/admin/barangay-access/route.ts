/**
 * app/api/admin/barangay-access/route.ts
 *
 * GET  /api/admin/barangay-access — list all barangays + open/closed status
 * PATCH /api/admin/barangay-access — bulk-update which barangays are open
 */
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@db/connection";

async function verifyAdmin(adminId: string): Promise<boolean> {
  const [user] = await query<{ role: string }>(
    `SELECT role FROM users WHERE id = :id AND role = 'admin' AND is_active = 1 LIMIT 1`,
    { id: Number(adminId) },
  );
  return !!user;
}

export async function GET(req: NextRequest) {
  const adminId = req.headers.get("x-admin-id");
  if (!adminId || !(await verifyAdmin(adminId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const rows = await query<{
      id: number;
      barangay: string;
      is_open: boolean;
      submission_open_date: Date | null;
      submission_close_date: Date | null;
      updated_at: string;
    }>(
      "SELECT id, barangay, is_open, submission_open_date, submission_close_date, updated_at FROM barangay_access ORDER BY barangay ASC",
      {},
    );

    // Normalize dates to YYYY-MM-DD strings (mysql2 returns Date objects)
    const data = rows.map((r) => ({
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

    // Close all first
    await execute(
      "UPDATE barangay_access SET is_open = 0, updated_by = :adminId",
      { adminId: Number(adminId) },
    );

    // Open selected ones
    if (openBarangays.length > 0) {
      // Use individual updates since named placeholders don't support IN arrays easily
      for (const brgy of openBarangays) {
        await execute(
          "UPDATE barangay_access SET is_open = 1, updated_by = :adminId WHERE barangay = :barangay",
          { adminId: Number(adminId), barangay: brgy },
        );
      }
    }

    // Update submission date windows per barangay
    if (submissionDates && typeof submissionDates === "object") {
      for (const [brgy, dates] of Object.entries(submissionDates)) {
        await execute(
          `UPDATE barangay_access
             SET submission_open_date  = :openDate,
                 submission_close_date = :closeDate,
                 updated_by = :adminId
           WHERE barangay = :barangay`,
          {
            openDate: dates.open || null,
            closeDate: dates.close || null,
            adminId: Number(adminId),
            barangay: brgy,
          },
        );
      }
    }

    return NextResponse.json({ message: "Barangay access updated" });
  } catch (err) {
    console.error("[PATCH /api/admin/barangay-access]", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
