/**
 * app/api/admin/validators/route.ts
 *
 * GET  /api/admin/validators — list all validator accounts.
 * POST /api/admin/validators — create a new validator account.
 * Admin only.
 */
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@db/connection";

interface ValidatorListRow {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  total_validations: number;
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
    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search") || undefined;

    const conditions: string[] = [];
    const bindValues: Record<string, unknown> = {};

    if (search) {
      conditions.push("(u.full_name LIKE :search OR u.email LIKE :search)");
      bindValues.search = `%${search}%`;
    }

    const whereClause =
      conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";

    const rows = await query<ValidatorListRow>(
      `
      SELECT
        u.id,
        u.email,
        u.full_name,
        u.is_active,
        u.created_at,
        (SELECT COUNT(*) FROM validations v WHERE v.validator_id = u.id) AS total_validations
      FROM users u
      WHERE u.role = 'validator' ${whereClause}
      ORDER BY u.created_at DESC
      `,
      bindValues,
    );

    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error("[GET /api/admin/validators]", err);
    return NextResponse.json(
      { error: "Failed to fetch validators" },
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
    const { email, fullName, password } = body as {
      email?: string;
      fullName?: string;
      password?: string;
    };

    if (!email || !fullName || !password) {
      return NextResponse.json(
        { error: "Email, full name, and password are required" },
        { status: 400 },
      );
    }

    // Check if email already exists
    const [existing] = await query<{ id: number }>(
      "SELECT id FROM users WHERE email = :email LIMIT 1",
      { email },
    );
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 },
      );
    }

    // Hash password
    let hash = password;
    try {
      const bcrypt = await import("bcrypt");
      hash = await bcrypt.hash(password, 10);
    } catch {
      // bcrypt not available — store raw (demo only)
    }

    const result = await execute(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES (:email, :password_hash, :full_name, 'validator')`,
      { email, password_hash: hash, full_name: fullName },
    );

    return NextResponse.json(
      { id: result.insertId, message: "Validator created successfully" },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/admin/validators]", err);
    return NextResponse.json(
      { error: "Failed to create validator" },
      { status: 500 },
    );
  }
}
