/**
 * app/api/admin/me/route.ts
 *
 * GET /api/admin/me — returns admin user profile info.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";

export async function GET(req: NextRequest) {
  const adminId = req.headers.get("x-admin-id");
  if (!adminId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, full_name, role")
      .eq("id", Number(adminId))
      .eq("role", "admin")
      .eq("is_active", true)
      .limit(1)
      .single();

    if (error || !user) {
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
