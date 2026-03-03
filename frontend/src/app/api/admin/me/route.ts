/**
 * app/api/admin/me/route.ts
 *
 * GET /api/admin/me — returns admin user profile info.
 */
import { NextRequest, NextResponse } from "next/server";
import { query } from "@db/connection";

interface AdminUserRow {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

export async function GET(req: NextRequest) {
  const adminId = req.headers.get("x-admin-id");
  if (!adminId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const [user] = await query<AdminUserRow>(
      `SELECT id, email, full_name, role
       FROM users
       WHERE id = :id AND role = 'admin' AND is_active = 1
       LIMIT 1`,
      { id: Number(adminId) },
    );

    if (!user) {
      return NextResponse.json(
        { error: "Admin user not found" },
        { status: 404 },
      );
    }

    const nameParts = user.full_name.trim().split(/\s+/);

    return NextResponse.json({
      user: {
        userId: user.id,
        email: user.email,
        fullName: user.full_name,
        firstName: nameParts[0] ?? "",
        lastName: nameParts.slice(1).join(" "),
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/me]", err);
    return NextResponse.json(
      { error: "Failed to load admin profile" },
      { status: 500 },
    );
  }
}
