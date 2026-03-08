import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";
import type { ApplicationWithDetails } from "@db/types";

interface RouteContext {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const { data: row, error: appError } = await supabase
      .from("applications")
      .select(
        `
        *,
        applicants!inner(
          users!inner(full_name)
        )
      `,
      )
      .eq("id", id)
      .maybeSingle();

    if (appError) throw appError;
    if (!row) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    const { applicants, ...rest } = row as Record<string, unknown> & {
      applicants: { users: { full_name: string } };
    };
    const application: ApplicationWithDetails = {
      ...rest,
      applicant_name: applicants?.users?.full_name ?? "",
    } as ApplicationWithDetails;

    const { data: history, error: histError } = await supabase
      .from("validations")
      .select(
        `
        *,
        users!validator_id(full_name)
      `,
      )
      .eq("application_id", id)
      .order("created_at", { ascending: false });

    if (histError) throw histError;

    const flatHistory = (history ?? []).map(
      (v: Record<string, unknown> & { users: { full_name: string } }) => {
        const { users, ...rest } = v;
        return {
          ...rest,
          validator_name: users?.full_name ?? "",
        };
      },
    );

    return NextResponse.json({ data: application, history: flatHistory });
  } catch (err) {
    console.error("[GET /api/applications/:id]", err);
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 },
    );
  }
}
