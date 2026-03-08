import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";
import { checkEligibility } from "@db/eligibility";
import type {
  ApplicationWithDetails,
  ApplicantRow,
  GetApplicationsQuery,
} from "@db/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const params: GetApplicationsQuery = {
      status:
        (searchParams.get("status") as GetApplicationsQuery["status"]) ??
        undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
    };

    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const offset = (page - 1) * limit;

    let dataQuery = supabase
      .from("applications")
      .select(
        `
        *,
        applicants!inner(
          users!inner(full_name)
        )
      `,
      )
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    let countQuery = supabase
      .from("applications")
      .select("*", { count: "exact", head: true });

    if (params.status) {
      dataQuery = dataQuery.eq("status", params.status);
      countQuery = countQuery.eq("status", params.status);
    }

    const [
      { data: rows, error: dataError },
      { count: total, error: countError },
    ] = await Promise.all([dataQuery, countQuery]);

    if (dataError) throw dataError;
    if (countError) throw countError;

    const flatRows: ApplicationWithDetails[] = (rows ?? []).map(
      (row: Record<string, unknown>) => {
        const { applicants, ...rest } = row as Record<string, unknown> & {
          applicants: { users: { full_name: string } };
        };
        return {
          ...rest,
          applicant_name: applicants?.users?.full_name ?? "",
        } as ApplicationWithDetails;
      },
    );

    const totalCount = total ?? 0;

    return NextResponse.json({
      data: flatRows,
      meta: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/applications]", err);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const applicantIdHeader = req.headers.get("x-applicant-id");
    if (!applicantIdHeader) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    const applicantId = Number(applicantIdHeader);

    const { data: applicant, error: applicantError } = await supabase
      .from("applicants")
      .select("*")
      .eq("id", applicantId)
      .maybeSingle();

    if (applicantError) throw applicantError;
    if (!applicant) {
      return NextResponse.json(
        { error: "Applicant not found" },
        { status: 404 },
      );
    }

    const eligibility = checkEligibility(applicant as ApplicantRow);
    if (!eligibility.eligible) {
      return NextResponse.json(
        { error: "Applicant is not eligible", reasons: eligibility.reasons },
        { status: 422 },
      );
    }

    const { data: existing, error: existingError } = await supabase
      .from("applications")
      .select("id")
      .eq("applicant_id", applicantId)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) {
      return NextResponse.json(
        { error: "Application already exists" },
        { status: 409 },
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from("applications")
      .insert({
        applicant_id: applicantId,
        status: "submitted",
        income_at_submission: 0,
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    return NextResponse.json(
      { id: inserted.id, message: "Application submitted successfully" },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/applications]", err);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 },
    );
  }
}
