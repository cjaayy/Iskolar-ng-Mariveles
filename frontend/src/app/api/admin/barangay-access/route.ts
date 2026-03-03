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
      updated_at: string;
    }>(
      "SELECT id, barangay, is_open, updated_at FROM barangay_access ORDER BY barangay ASC",
      {},
    );

    return NextResponse.json({ data: rows });
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
    const { openBarangays } = body as { openBarangays: string[] };

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

    return NextResponse.json({ message: "Barangay access updated" });
  } catch (err) {
    console.error("[PATCH /api/admin/barangay-access]", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
