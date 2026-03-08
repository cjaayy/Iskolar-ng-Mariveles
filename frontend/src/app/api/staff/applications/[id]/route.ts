import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";
import { REQUIREMENT_CONFIGS } from "@/config/requirements";

interface RouteContext {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const validatorId = req.headers.get("x-validator-id");
  if (!validatorId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const { data: appRow, error: appError } = await supabase
      .from("applications")
      .select(
        `
        *,
        applicants!inner(
          *,
          users!inner(full_name, email)
        )
      `,
      )
      .eq("id", id)
      .maybeSingle();

    if (appError) throw appError;

    if (!appRow) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    const applicant = appRow.applicants as Record<string, unknown> & {
      users: { full_name: string; email: string };
    };
    const user = applicant.users;

    const application: Record<string, unknown> = {
      id: appRow.id,
      applicant_id: appRow.applicant_id,
      status: appRow.status,
      income_at_submission: appRow.income_at_submission,
      submitted_at: appRow.submitted_at,
      created_at: appRow.created_at,
      updated_at: appRow.updated_at,
      remarks: appRow.remarks,
      applicant_name: user.full_name,
      applicant_email: user.email,
      contact_number: applicant.contact_number,
      address: applicant.address,
      date_of_birth: applicant.date_of_birth,
      gender: applicant.gender,
      blood_type: applicant.blood_type,
      civil_status: applicant.civil_status,
      maiden_name: applicant.maiden_name,
      spouse_name: applicant.spouse_name,
      spouse_occupation: applicant.spouse_occupation,
      religion: applicant.religion,
      height_cm: applicant.height_cm,
      weight_kg: applicant.weight_kg,
      birthplace: applicant.birthplace,
      house_street: applicant.house_street,
      town: applicant.town,
      barangay: applicant.barangay,
      father_name: applicant.father_name,
      father_occupation: applicant.father_occupation,
      father_contact: applicant.father_contact,
      mother_name: applicant.mother_name,
      mother_occupation: applicant.mother_occupation,
      mother_contact: applicant.mother_contact,
      guardian_name: applicant.guardian_name,
      guardian_relation: applicant.guardian_relation,
      guardian_contact: applicant.guardian_contact,
      primary_school: applicant.primary_school,
      primary_address: applicant.primary_address,
      primary_year_graduated: applicant.primary_year_graduated,
      secondary_school: applicant.secondary_school,
      secondary_address: applicant.secondary_address,
      secondary_year_graduated: applicant.secondary_year_graduated,
      tertiary_school: applicant.tertiary_school,
      tertiary_address: applicant.tertiary_address,
      tertiary_year_graduated: applicant.tertiary_year_graduated,
      tertiary_program: applicant.tertiary_program,
    };

    const { data: submissions, error: subError } = await supabase
      .from("requirement_submissions")
      .select(
        `
        *,
        validator:users!requirement_submissions_validated_by_fkey(full_name)
      `,
      )
      .eq("application_id", id)
      .order("requirement_key", { ascending: true });

    if (subError) throw subError;

    const subMap = Object.fromEntries(
      (submissions ?? []).map((s: Record<string, unknown>) => [
        s.requirement_key,
        s,
      ]),
    );

    const requirements = REQUIREMENT_CONFIGS.map((config, idx) => {
      const sub = (subMap[config.key] as Record<string, unknown>) ?? null;
      const validator = sub?.validator as { full_name: string } | null;
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

    const { data: history, error: histError } = await supabase
      .from("validations")
      .select(
        `
        *,
        validator:users!validations_validator_id_fkey(full_name)
      `,
      )
      .eq("application_id", id)
      .order("created_at", { ascending: false });

    if (histError) throw histError;

    const flatHistory = (history ?? []).map((h: Record<string, unknown>) => {
      const val = h.validator as { full_name: string } | null;
      const { validator: _unused, ...rest } = h;
      return {
        ...rest,
        validator_name: val?.full_name ?? null,
      };
    });

    return NextResponse.json({
      data: application,
      requirements,
      history: flatHistory,
    });
  } catch (err) {
    console.error("[GET /api/staff/applications/:id]", err);
    return NextResponse.json(
      { error: "Failed to fetch application details" },
      { status: 500 },
    );
  }
}
