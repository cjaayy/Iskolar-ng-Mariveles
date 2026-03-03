/**
 * app/api/admin/invites/route.ts
 *
 * GET  /api/admin/invites — list all registration links.
 * POST /api/admin/invites — create a new registration link.
 * Admin only.
 */
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@db/connection";
import crypto from "crypto";

interface InviteLinkRow {
  id: number;
  token: string;
  label: string | null;
  max_uses: number;
  times_used: number;
  expires_at: string | null;
  created_by: number;
  creator_name: string;
  is_active: boolean;
  created_at: string;
}

async function verifyAdmin(adminId: string): Promise<boolean> {
  const [user] = await query<{ role: string }>(
    `SELECT role FROM users WHERE id = :id AND role = 'admin' AND is_active = 1 LIMIT 1`,
    { id: Number(adminId) },
  );
  return !!user;
}

export async function GET(req: NextRequest) {
  const adminId = req.headers.get("x-admin-id");
  if (!adminId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!(await verifyAdmin(adminId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const rows = await query<InviteLinkRow>(
      `
      SELECT
        rl.id,
        rl.token,
        rl.label,
        rl.max_uses,
        rl.times_used,
        rl.expires_at,
        rl.created_by,
        u.full_name AS creator_name,
        rl.is_active,
        rl.created_at
      FROM registration_links rl
      JOIN users u ON u.id = rl.created_by
      ORDER BY rl.created_at DESC
      `,
    );

    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error("[GET /api/admin/invites]", err);
    return NextResponse.json(
      { error: "Failed to fetch invite links" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const adminId = req.headers.get("x-admin-id");
  if (!adminId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!(await verifyAdmin(adminId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { label, maxUses, expiresAt } = body as {
      label?: string;
      maxUses?: number;
      expiresAt?: string;
    };

    // Generate a unique token
    const token = crypto.randomBytes(32).toString("hex");

    const result = await execute(
      `INSERT INTO registration_links (token, label, max_uses, expires_at, created_by)
       VALUES (:token, :label, :max_uses, :expires_at, :created_by)`,
      {
        token,
        label: label || null,
        max_uses: maxUses ?? 1,
        expires_at: expiresAt || null,
        created_by: Number(adminId),
      },
    );

    return NextResponse.json(
      {
        id: result.insertId,
        token,
        message: "Registration link created successfully",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/admin/invites]", err);
    return NextResponse.json(
      { error: "Failed to create invite link" },
      { status: 500 },
    );
  }
}
