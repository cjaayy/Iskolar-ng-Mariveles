/**
 * app/api/admin/validators/route.ts
 *
 * GET    /api/admin/validators          — list all validator accounts.
 * POST   /api/admin/validators          — create a new validator account.
 * PATCH  /api/admin/validators          — toggle active / assign barangay.
 * DELETE /api/admin/validators?id=<id>  — permanently delete a validator.
 * Admin only.
 */
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@db/connection";

interface ValidatorListRow {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  assigned_barangay: string | null;
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

/* ─── GET ─── list validators ─── */
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
        u.assigned_barangay,
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

/* ─── POST ─── create validator ─── */
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
    const { email, fullName, password, assignedBarangay } = body as {
      email?: string;
      fullName?: string;
      password?: string;
      assignedBarangay?: string;
    };

    if (!email || !fullName || !password) {
      return NextResponse.json(
        { error: "Email, full name, and password are required" },
        { status: 400 },
      );
    }

    if (!assignedBarangay) {
      return NextResponse.json(
        { error: "Assigned barangay is required" },
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

    // Check if another validator is already assigned to this barangay
    const [barangayTaken] = await query<{ id: number; full_name: string }>(
      `SELECT id, full_name FROM users
       WHERE role = 'validator' AND assigned_barangay = :barangay AND is_active = 1
       LIMIT 1`,
      { barangay: assignedBarangay },
    );
    if (barangayTaken) {
      return NextResponse.json(
        {
          error: `Barangay ${assignedBarangay} is already assigned to ${barangayTaken.full_name}`,
        },
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
      `INSERT INTO users (email, password_hash, full_name, role, assigned_barangay)
       VALUES (:email, :password_hash, :full_name, 'validator', :assigned_barangay)`,
      {
        email,
        password_hash: hash,
        full_name: fullName,
        assigned_barangay: assignedBarangay,
      },
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

/* ─── PATCH ─── toggle active / update barangay ─── */
export async function PATCH(req: NextRequest) {
  const adminId = req.headers.get("x-admin-id");
  if (!adminId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!(await verifyAdmin(adminId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, action, assignedBarangay } = body as {
      id?: number;
      action?: "activate" | "deactivate" | "assign_barangay";
      assignedBarangay?: string;
    };

    if (!id || !action) {
      return NextResponse.json(
        { error: "id and action are required" },
        { status: 400 },
      );
    }

    // Verify target is a validator
    const [target] = await query<{ role: string }>(
      "SELECT role FROM users WHERE id = :id AND role = 'validator' LIMIT 1",
      { id },
    );
    if (!target) {
      return NextResponse.json(
        { error: "Validator not found" },
        { status: 404 },
      );
    }

    if (action === "activate") {
      await execute("UPDATE users SET is_active = 1 WHERE id = :id", { id });
      return NextResponse.json({ message: "Validator activated" });
    }

    if (action === "deactivate") {
      await execute("UPDATE users SET is_active = 0 WHERE id = :id", { id });
      return NextResponse.json({ message: "Validator deactivated" });
    }

    if (action === "assign_barangay") {
      if (!assignedBarangay) {
        return NextResponse.json(
          { error: "assignedBarangay is required" },
          { status: 400 },
        );
      }
      // Check if another active validator is already assigned to this barangay
      const [taken] = await query<{ id: number; full_name: string }>(
        `SELECT id, full_name FROM users
         WHERE role = 'validator' AND assigned_barangay = :barangay AND is_active = 1 AND id != :validatorId
         LIMIT 1`,
        { barangay: assignedBarangay, validatorId: id },
      );
      if (taken) {
        return NextResponse.json(
          {
            error: `Barangay ${assignedBarangay} is already assigned to ${taken.full_name}`,
          },
          { status: 409 },
        );
      }
      await execute(
        "UPDATE users SET assigned_barangay = :barangay WHERE id = :id",
        { barangay: assignedBarangay, id },
      );
      return NextResponse.json({ message: "Barangay assigned" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[PATCH /api/admin/validators]", err);
    return NextResponse.json(
      { error: "Failed to update validator" },
      { status: 500 },
    );
  }
}

/* ─── DELETE ─── remove validator ─── */
export async function DELETE(req: NextRequest) {
  const adminId = req.headers.get("x-admin-id");
  if (!adminId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!(await verifyAdmin(adminId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = req.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Validator id is required" },
        { status: 400 },
      );
    }

    // Verify target is a validator (prevent deleting admins)
    const [target] = await query<{ role: string }>(
      "SELECT role FROM users WHERE id = :id AND role = 'validator' LIMIT 1",
      { id: Number(id) },
    );
    if (!target) {
      return NextResponse.json(
        { error: "Validator not found" },
        { status: 404 },
      );
    }

    await execute("DELETE FROM users WHERE id = :id AND role = 'validator'", {
      id: Number(id),
    });

    return NextResponse.json({ message: "Validator deleted successfully" });
  } catch (err) {
    console.error("[DELETE /api/admin/validators]", err);
    return NextResponse.json(
      { error: "Failed to delete validator" },
      { status: 500 },
    );
  }
}
