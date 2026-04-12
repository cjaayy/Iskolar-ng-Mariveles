import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";
import { coerceId } from "@/lib/adminId";

const normalizeSchool = (value: string) =>
  value.replace(/\s*\(.*\)\s*$/, "").trim();

const parseEncoderId = (value: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") return null;
  const numeric = Number(trimmed);
  const isNumeric = Number.isFinite(numeric);
  const isUuid = /^[0-9a-fA-F-]{36}$/.test(trimmed);
  if (!isNumeric && !isUuid) return null;
  return trimmed;
};

export async function GET(req: NextRequest) {
  const encoderId = parseEncoderId(req.headers.get("x-encoder-id"));
  if (!encoderId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, full_name, role, assigned_school")
      .eq("id", coerceId(encoderId))
      .eq("role", "encoder")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return NextResponse.json(
        { error: "Encoder user not found" },
        { status: 404 },
      );
    }

    const nameParts = user.full_name.trim().split(/\s+/);
    const assignedSchool = user.assigned_school?.trim() ?? null;
    let assignedSchoolLevel: string | null = null;

    if (assignedSchool) {
      const { data: access } = await supabase
        .from("school_access")
        .select("education_level")
        .eq("school_name", assignedSchool)
        .limit(1)
        .maybeSingle<{ education_level: string }>();

      assignedSchoolLevel = access?.education_level ?? null;

      if (!assignedSchoolLevel) {
        const normalized = normalizeSchool(assignedSchool);
        if (normalized && normalized !== assignedSchool) {
          const { data: fallback } = await supabase
            .from("school_access")
            .select("education_level")
            .eq("school_name", normalized)
            .limit(1)
            .maybeSingle<{ education_level: string }>();
          assignedSchoolLevel = fallback?.education_level ?? null;
        }
      }
    }

    return NextResponse.json({
      user: {
        userId: user.id,
        email: user.email,
        fullName: user.full_name,
        firstName: nameParts[0] ?? "",
        lastName: nameParts.slice(1).join(" "),
        role: user.role,
        assignedSchool,
        assignedSchoolLevel,
      },
    });
  } catch (err) {
    console.error("[GET /api/encoder/me]", err);
    return NextResponse.json(
      { error: "Failed to load encoder profile" },
      { status: 500 },
    );
  }
}
