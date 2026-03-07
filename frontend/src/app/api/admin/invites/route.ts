/**
 * app/api/admin/invites/route.ts
 *
 * GET  /api/admin/invites — list all registration links.
 * POST /api/admin/invites — create a new registration link.
 * Admin only.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";
import crypto from "crypto";

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

export async function GET(req: NextRequest) {
  const adminId = req.headers.get("x-admin-id");
  if (!adminId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!(await verifyAdmin(adminId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { data: rows, error } = await supabase
      .from("registration_links")
      .select(
        `
        id,
        token,
        label,
        max_uses,
        times_used,
        expires_at,
        created_by,
        is_active,
        created_at,
        users!inner(full_name)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Flatten the joined user name into creator_name
    const data = (rows ?? []).map((row: Record<string, unknown>) => {
      const user = row.users as { full_name: string };
      return {
        id: row.id,
        token: row.token,
        label: row.label,
        max_uses: row.max_uses,
        times_used: row.times_used,
        expires_at: row.expires_at,
        created_by: row.created_by,
        creator_name: user.full_name,
        is_active: row.is_active,
        created_at: row.created_at,
      };
    });

    return NextResponse.json({ data });
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

    const { data, error } = await supabase
      .from("registration_links")
      .insert({
        token,
        label: label || null,
        max_uses: maxUses ?? 1,
        expires_at: expiresAt || null,
        created_by: Number(adminId),
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        id: data.id,
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
