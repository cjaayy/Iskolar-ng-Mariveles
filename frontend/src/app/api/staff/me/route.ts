import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";

export async function GET(req: NextRequest) {
  const validatorId = req.headers.get("x-validator-id");
  if (!validatorId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, full_name, role, assigned_barangay")
      .eq("id", Number(validatorId))
      .in("role", ["validator", "admin"])
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (error) throw error;

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
        assignedBarangay: user.assigned_barangay ?? null,
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
