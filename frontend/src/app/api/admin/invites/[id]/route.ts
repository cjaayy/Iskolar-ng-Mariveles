import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";

async function verifyAdmin(adminId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", Number(adminId))
    .eq("role", "admin")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  return !error && !!data;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminId = req.headers.get("x-admin-id");
  if (!adminId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!(await verifyAdmin(adminId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { isActive } = body as { isActive?: boolean };

    const { error } = await supabase
      .from("registration_links")
      .update({ is_active: !!isActive })
      .eq("id", Number(id));

    if (error) throw error;

    return NextResponse.json({ message: "Link updated" });
  } catch (err) {
    console.error("[PATCH /api/admin/invites/:id]", err);
    return NextResponse.json(
      { error: "Failed to update invite link" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminId = req.headers.get("x-admin-id");
  if (!adminId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!(await verifyAdmin(adminId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;

    const { error } = await supabase
      .from("registration_links")
      .delete()
      .eq("id", Number(id));

    if (error) throw error;

    return NextResponse.json({ message: "Link deleted" });
  } catch (err) {
    console.error("[DELETE /api/admin/invites/:id]", err);
    return NextResponse.json(
      { error: "Failed to delete invite link" },
      { status: 500 },
    );
  }
}
