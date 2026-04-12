import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";
import { coerceId } from "@/lib/adminId";

async function verifyAdmin(adminId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", coerceId(adminId))
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
      .select("id, email, full_name, is_active, assigned_school, created_at")
      .eq("role", "encoder")
      .order("created_at", { ascending: false });

    if (search) {
      q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: encoders, error } = await q;
    if (error) throw error;

    return NextResponse.json({ data: encoders ?? [] });
  } catch (err) {
    console.error("[GET /api/admin/encoders]", err);
    return NextResponse.json(
      { error: "Failed to fetch encoders" },
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
    const { email, fullName, password, assignedSchool } = body as {
      email?: string;
      fullName?: string;
      password?: string;
      assignedSchool?: string;
    };

    if (!email || !fullName || !password) {
      return NextResponse.json(
        { error: "Email, full name, and password are required" },
        { status: 400 },
      );
    }

    if (!assignedSchool) {
      return NextResponse.json(
        { error: "Assigned school is required" },
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

    const { data: schoolTaken } = await supabase
      .from("users")
      .select("id, full_name")
      .eq("role", "encoder")
      .eq("assigned_school", assignedSchool)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (schoolTaken) {
      return NextResponse.json(
        {
          error: `School "${assignedSchool}" is already assigned to ${schoolTaken.full_name}`,
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
        role: "encoder",
        assigned_school: assignedSchool,
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json(
      { id: inserted.id, message: "Encoder created successfully" },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/admin/encoders]", err);
    return NextResponse.json(
      { error: "Failed to create encoder" },
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
    const { id, action, assignedSchool } = body as {
      id?: number;
      action?: "activate" | "deactivate" | "assign_school";
      assignedSchool?: string;
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
      .eq("role", "encoder")
      .limit(1)
      .maybeSingle();

    if (!target) {
      return NextResponse.json({ error: "Encoder not found" }, { status: 404 });
    }

    if (action === "activate") {
      const { error } = await supabase
        .from("users")
        .update({ is_active: true })
        .eq("id", id);
      if (error) throw error;
      return NextResponse.json({ message: "Encoder activated" });
    }

    if (action === "deactivate") {
      const { error } = await supabase
        .from("users")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
      return NextResponse.json({ message: "Encoder deactivated" });
    }

    if (action === "assign_school") {
      if (!assignedSchool) {
        return NextResponse.json(
          { error: "assignedSchool is required" },
          { status: 400 },
        );
      }

      const { data: taken } = await supabase
        .from("users")
        .select("id, full_name")
        .eq("role", "encoder")
        .eq("assigned_school", assignedSchool)
        .eq("is_active", true)
        .neq("id", id)
        .limit(1)
        .maybeSingle();

      if (taken) {
        return NextResponse.json(
          {
            error: `School "${assignedSchool}" is already assigned to ${taken.full_name}`,
          },
          { status: 409 },
        );
      }

      const { error } = await supabase
        .from("users")
        .update({ assigned_school: assignedSchool })
        .eq("id", id);
      if (error) throw error;
      return NextResponse.json({ message: "School assigned" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[PATCH /api/admin/encoders]", err);
    return NextResponse.json(
      { error: "Failed to update encoder" },
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
        { error: "Encoder id is required" },
        { status: 400 },
      );
    }

    const { data: target } = await supabase
      .from("users")
      .select("role")
      .eq("id", Number(id))
      .eq("role", "encoder")
      .limit(1)
      .maybeSingle();

    if (!target) {
      return NextResponse.json({ error: "Encoder not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", Number(id))
      .eq("role", "encoder");

    if (error) throw error;

    return NextResponse.json({ message: "Encoder deleted successfully" });
  } catch (err) {
    console.error("[DELETE /api/admin/encoders]", err);
    return NextResponse.json(
      { error: "Failed to delete encoder" },
      { status: 500 },
    );
  }
}
