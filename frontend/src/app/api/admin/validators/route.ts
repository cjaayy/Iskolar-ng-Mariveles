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

    let q = supabase
      .from("users")
      .select("id, email, full_name, is_active, assigned_barangay, created_at")
      .eq("role", "validator")
      .order("created_at", { ascending: false });

    if (search) {
      q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: validators, error } = await q;
    if (error) throw error;

    const validatorIds = (validators ?? []).map(
      (v: Record<string, any>) => v.id,
    );
    let validationCounts: Record<number, number> = {};

    if (validatorIds.length > 0) {
      const { data: counts, error: countError } = await supabase
        .from("validations")
        .select("validator_id")
        .in("validator_id", validatorIds);

      if (countError) throw countError;

      validationCounts = (counts ?? []).reduce(
        (acc: Record<number, number>, row: { validator_id: number }) => {
          acc[row.validator_id] = (acc[row.validator_id] || 0) + 1;
          return acc;
        },
        {},
      );
    }

    const data = (validators ?? []).map((v: Record<string, any>) => ({
      ...v,
      total_validations: validationCounts[v.id] || 0,
    }));

    return NextResponse.json({ data });
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

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 },
      );
    }

    const { data: barangayTaken } = await supabase
      .from("users")
      .select("id, full_name")
      .eq("role", "validator")
      .eq("assigned_barangay", assignedBarangay)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (barangayTaken) {
      return NextResponse.json(
        {
          error: `Barangay ${assignedBarangay} is already assigned to ${barangayTaken.full_name}`,
        },
        { status: 409 },
      );
    }

    let hash = password;
    try {
      const bcrypt = await import("bcrypt");
      hash = await bcrypt.hash(password, 10);
    } catch {}

    const { data: inserted, error } = await supabase
      .from("users")
      .insert({
        email,
        password_hash: hash,
        full_name: fullName,
        role: "validator",
        assigned_barangay: assignedBarangay,
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json(
      { id: inserted.id, message: "Validator created successfully" },
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

    const { data: target } = await supabase
      .from("users")
      .select("role")
      .eq("id", id)
      .eq("role", "validator")
      .limit(1)
      .maybeSingle();

    if (!target) {
      return NextResponse.json(
        { error: "Validator not found" },
        { status: 404 },
      );
    }

    if (action === "activate") {
      const { error } = await supabase
        .from("users")
        .update({ is_active: true })
        .eq("id", id);
      if (error) throw error;
      return NextResponse.json({ message: "Validator activated" });
    }

    if (action === "deactivate") {
      const { error } = await supabase
        .from("users")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
      return NextResponse.json({ message: "Validator deactivated" });
    }

    if (action === "assign_barangay") {
      if (!assignedBarangay) {
        return NextResponse.json(
          { error: "assignedBarangay is required" },
          { status: 400 },
        );
      }
      const { data: taken } = await supabase
        .from("users")
        .select("id, full_name")
        .eq("role", "validator")
        .eq("assigned_barangay", assignedBarangay)
        .eq("is_active", true)
        .neq("id", id)
        .limit(1)
        .maybeSingle();

      if (taken) {
        return NextResponse.json(
          {
            error: `Barangay ${assignedBarangay} is already assigned to ${taken.full_name}`,
          },
          { status: 409 },
        );
      }

      const { error } = await supabase
        .from("users")
        .update({ assigned_barangay: assignedBarangay })
        .eq("id", id);
      if (error) throw error;
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

    const { data: target } = await supabase
      .from("users")
      .select("role")
      .eq("id", Number(id))
      .eq("role", "validator")
      .limit(1)
      .maybeSingle();

    if (!target) {
      return NextResponse.json(
        { error: "Validator not found" },
        { status: 404 },
      );
    }

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", Number(id))
      .eq("role", "validator");

    if (error) throw error;

    return NextResponse.json({ message: "Validator deleted successfully" });
  } catch (err) {
    console.error("[DELETE /api/admin/validators]", err);
    return NextResponse.json(
      { error: "Failed to delete validator" },
      { status: 500 },
    );
  }
}
