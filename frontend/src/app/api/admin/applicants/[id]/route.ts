/**
 * app/api/admin/applicants/[id]/route.ts
 *
 * GET /api/admin/applicants/:id — fetch a single application with all
 * requirement submissions + validation history for admin review (read-only).
 * Returns the same shape as the staff detail endpoint so the UI can be shared.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";
import { REQUIREMENT_CONFIGS } from "@/config/requirements";

interface RouteContext {
  params: { id: string };
}

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

export async function GET(req: NextRequest, { params }: RouteContext) {
  const adminId = req.headers.get("x-admin-id");
  if (!adminId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!(await verifyAdmin(adminId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    // Application + applicant details
    const { data: appRow, error: appError } = await supabase
      .from("applications")
      .select(
        `
        *,
        applicants!inner(
          contact_number,
          address,
          barangay,
          users!inner(full_name, email)
        )
      `,
      )
      .eq("id", id)
      .limit(1)
      .maybeSingle();

    if (appError) throw appError;

    if (!appRow) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    // Flatten the joined data
    const applicant = appRow.applicants as unknown as {
      contact_number: string | null;
      address: string | null;
      barangay: string | null;
      users: { full_name: string; email: string };
    };

    const application = {
      ...appRow,
      applicants: undefined,
      applicant_name: applicant.users.full_name,
      applicant_email: applicant.users.email,
      contact_number: applicant.contact_number,
      address: applicant.address,
      barangay: applicant.barangay,
    };

    // All requirement submissions for this application
    const { data: submissions, error: subError } = await supabase
      .from("requirement_submissions")
      .select(
        `
        *,
        users:validated_by(full_name)
      `,
      )
      .eq("application_id", id)
      .order("requirement_key", { ascending: true });

    if (subError) throw subError;

    // Merge requirement configs with actual submissions
    const subMap = Object.fromEntries(
      (submissions ?? []).map((s: Record<string, unknown>) => [
        s.requirement_key,
        s,
      ]),
    );

    const requirements = REQUIREMENT_CONFIGS.map((config, idx) => {
      const sub = subMap[config.key] ?? null;
      const validator = sub?.users as { full_name: string } | null;
      return {
        id: sub ? (sub.id as number) : -(idx + 1),
        application_id: id,
        requirement_key: config.key,
        status: (sub?.status as string) ?? "missing",
        progress: (sub?.progress as number) ?? 0,
        file_name: (sub?.file_name as string) ?? null,
        file_url: (sub?.file_url as string) ?? null,
        uploaded_at: (sub?.uploaded_at as string) ?? null,
        notes: (sub?.notes as string) ?? null,
        validated_by: (sub?.validated_by as number) ?? null,
        validated_at: (sub?.validated_at as string) ?? null,
        validator_notes: (sub?.validator_notes as string) ?? null,
        validator_name: validator?.full_name ?? null,
      };
    });

    // Validation history
    const { data: history, error: histError } = await supabase
      .from("validations")
      .select(
        `
        *,
        users!inner(full_name)
      `,
      )
      .eq("application_id", id)
      .order("created_at", { ascending: false });

    if (histError) throw histError;

    const historyRows = (history ?? []).map((h: Record<string, unknown>) => {
      const user = h.users as { full_name: string };
      return {
        ...h,
        users: undefined,
        validator_name: user.full_name,
      };
    });

    return NextResponse.json({
      data: application,
      requirements,
      history: historyRows,
    });
  } catch (err) {
    console.error("[GET /api/admin/applicants/:id]", err);
    return NextResponse.json(
      { error: "Failed to fetch application details" },
      { status: 500 },
    );
  }
}
