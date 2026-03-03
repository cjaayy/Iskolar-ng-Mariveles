/**
 * app/api/admin/invites/[id]/route.ts
 *
 * PATCH  /api/admin/invites/:id — toggle invite link active status
 * DELETE /api/admin/invites/:id — delete an invite link
 * Admin only.
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

    await execute(
      `UPDATE registration_links SET is_active = :is_active WHERE id = :id`,
      { is_active: isActive ? 1 : 0, id: Number(id) },
    );

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
    await execute(`DELETE FROM registration_links WHERE id = :id`, {
      id: Number(id),
    });

    return NextResponse.json({ message: "Link deleted" });
  } catch (err) {
    console.error("[DELETE /api/admin/invites/:id]", err);
    return NextResponse.json(
      { error: "Failed to delete invite link" },
      { status: 500 },
    );
  }
}
