/**
 * app/api/staff/me/route.ts
 *
 * GET /api/staff/me — returns staff/validator profile info.
 */
import { NextRequest, NextResponse } from "next/server";
import { query } from "@db/connection";

interface StaffUserRow {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

export async function GET(req: NextRequest) {
  const validatorId = req.headers.get("x-validator-id");
  if (!validatorId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const [user] = await query<StaffUserRow>(
      `SELECT id, email, full_name, role
       FROM users
       WHERE id = :id AND role IN ('validator', 'admin') AND is_active = 1
       LIMIT 1`,
      { id: Number(validatorId) },
    );

    if (!user) {
      return NextResponse.json(
        { error: "Staff user not found" },
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
    console.error("[GET /api/staff/me]", err);
    return NextResponse.json(
      { error: "Failed to load staff profile" },
      { status: 500 },
    );
  }
}
