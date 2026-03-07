/**
 * app/api/staff/validate/route.ts
 *
 * PUT /api/staff/validate — staff validates a single requirement submission
 *   Body: { submissionId, action: 'approved' | 'rejected', notes?: string }
 *
 * POST /api/staff/validate — staff validates ALL requirements of an application at once
 *   Body: { applicationId, action: 'approved' | 'rejected', notes?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";

// ─── PUT: validate a single requirement ──────────────────────────────────────

export async function PUT(req: NextRequest) {
  const validatorId = req.headers.get("x-validator-id");
  if (!validatorId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { submissionId, action, notes } = body as {
      submissionId: number;
      action: "approved" | "rejected";
      notes?: string;
    };

    if (!submissionId || !["approved", "rejected"].includes(action)) {
      return NextResponse.json(
        {
          error:
            "submissionId and action ('approved' or 'rejected') are required",
        },
        { status: 422 },
      );
    }

    // Check submission exists
    const { data: submission, error: subError } = await supabase
      .from("requirement_submissions")
      .select("id, application_id, status")
      .eq("id", submissionId)
      .maybeSingle();

    if (subError) throw subError;

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 },
      );
    }

    // Call RPC to validate the single requirement
    const { error: rpcError } = await supabase.rpc(
      "validate_single_requirement",
      {
        p_submission_id: submissionId,
        p_validator_id: Number(validatorId),
        p_action: action,
        p_notes: notes ?? null,
      },
    );

    if (rpcError) throw rpcError;

    return NextResponse.json({
      message: `Document ${action} successfully`,
      submissionId,
      action,
    });
  } catch (err) {
    console.error("[PUT /api/staff/validate]", err);
    return NextResponse.json(
      { error: "Failed to validate document" },
      { status: 500 },
    );
  }
}

// ─── POST: bulk validate all pending requirements of an application ──────────

export async function POST(req: NextRequest) {
  const validatorId = req.headers.get("x-validator-id");
  if (!validatorId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { applicationId, action, notes } = body as {
      applicationId: number;
      action: "approved" | "rejected";
      notes?: string;
    };

    if (!applicationId || !["approved", "rejected"].includes(action)) {
      return NextResponse.json(
        { error: "applicationId and action are required" },
        { status: 422 },
      );
    }

    // Call RPC to bulk validate all pending requirements
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "bulk_validate_requirements",
      {
        p_application_id: applicationId,
        p_validator_id: Number(validatorId),
        p_action: action,
        p_notes: notes ?? null,
      },
    );

    if (rpcError) throw rpcError;

    const affected = typeof rpcResult === "number" ? rpcResult : 0;

    return NextResponse.json({
      message: `${affected} document(s) ${action} successfully`,
      applicationId,
      action,
      affected,
    });
  } catch (err) {
    console.error("[POST /api/staff/validate]", err);
    return NextResponse.json(
      { error: "Failed to bulk validate" },
      { status: 500 },
    );
  }
}
