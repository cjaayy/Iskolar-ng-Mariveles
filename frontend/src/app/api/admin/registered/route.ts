/**
 * app/api/admin/registered/route.ts
 *
 * GET /api/admin/registered — list all registered applicant accounts with address info.
 * Supports ?barangay= filter and ?search= for name/email.
 */
import { NextRequest, NextResponse } from "next/server";
import { query } from "@db/connection";

async function verifyAdmin(adminId: string): Promise<boolean> {
  const [user] = await query<{ role: string }>(
    `SELECT role FROM users WHERE id = :id AND role = 'admin' AND is_active = 1 LIMIT 1`,
    { id: Number(adminId) },
  );
  return !!user;
}

interface RegisteredRow {
  user_id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  applicant_id: number;
  address: string | null;
  created_at: string;
}

export async function GET(req: NextRequest) {
  const adminId = req.headers.get("x-admin-id");
  if (!adminId || !(await verifyAdmin(adminId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search") || undefined;
    const barangay = searchParams.get("barangay") || undefined;

    const conditions: string[] = [];
    const bind: Record<string, unknown> = {};

    if (search) {
      conditions.push("(u.full_name LIKE :search OR u.email LIKE :search)");
      bind.search = `%${search}%`;
    }
    if (barangay) {
      conditions.push("a.address LIKE :barangay");
      bind.barangay = `%${barangay}%`;
    }

    const where =
      conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";

    const rows = await query<RegisteredRow>(
      `
      SELECT
        u.id         AS user_id,
        u.email,
        u.full_name,
        u.is_active,
        a.id         AS applicant_id,
        a.address,
        u.created_at
      FROM users u
      JOIN applicants a ON a.user_id = u.id
      WHERE u.role = 'applicant' ${where}
      ORDER BY u.created_at DESC
      `,
      bind,
    );

    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error("[GET /api/admin/registered]", err);
    return NextResponse.json(
      { error: "Failed to fetch registered applicants" },
      { status: 500 },
    );
  }
}
