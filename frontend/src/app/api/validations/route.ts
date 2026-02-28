/**
 * app/api/validations/route.ts
 *
 * PUT /api/validations — validator reviews an application
 */
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@db/connection";
import type {
  ApplicationRow,
  UpdateValidationBody,
  ValidationChecklist,
} from "@db/types";

// Allowed transitions: current status → valid next statuses
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  submitted: ["under_review"],
  under_review: ["approved", "rejected", "returned", "requested_info"],
  returned: ["under_review"],
};

export async function PUT(req: NextRequest) {
  try {
    // ── Parse body ────────────────────────────────────────────────────────────
    let body: UpdateValidationBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { application_id, action, checklist, notes } = body;

    // ── Input validation ──────────────────────────────────────────────────────
    const validActions = ["approved", "rejected", "returned", "requested_info"];
    if (!application_id || !Number.isInteger(Number(application_id))) {
      return NextResponse.json(
        { error: "application_id is required" },
        { status: 422 },
      );
    }
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: `action must be one of: ${validActions.join(", ")}` },
        { status: 422 },
      );
    }
    if (notes && notes.length > 2000) {
      return NextResponse.json(
        { error: "notes must not exceed 2000 characters" },
        { status: 422 },
      );
    }

    // ── Resolve validator from header (replace with real auth session) ────────
    const validatorIdHeader = req.headers.get("x-validator-id");
    if (!validatorIdHeader) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    const validatorId = Number(validatorIdHeader);

    // ── Load application ──────────────────────────────────────────────────────
    const [application] = await query<ApplicationRow>(
      "SELECT * FROM applications WHERE id = :id LIMIT 1",
      { id: application_id },
    );
    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    // ── Check status transition allowed ───────────────────────────────────────
    const allowed = ALLOWED_TRANSITIONS[application.status] ?? [];
    // Map action → ultimate application status
    const actionToStatus: Record<string, string> = {
      approved: "approved",
      rejected: "rejected",
      returned: "returned",
      requested_info: "under_review",
    };
    const nextStatus = actionToStatus[action];

    if (!allowed.includes(nextStatus) && action !== "requested_info") {
      return NextResponse.json(
        {
          error: `Cannot perform '${action}' on an application with status '${application.status}'`,
        },
        { status: 409 },
      );
    }

    // ── Validate checklist when approving ─────────────────────────────────────
    if (action === "approved") {
      const cl = checklist as ValidationChecklist | undefined;
      if (
        !cl ||
        !cl.gpa_met ||
        !cl.income_met ||
        !cl.documents_complete ||
        !cl.enrollment_verified
      ) {
        return NextResponse.json(
          { error: "All checklist items must be true before approving" },
          { status: 422 },
        );
      }
    }

    // ── Write validation record ───────────────────────────────────────────────
    await execute(
      `
      INSERT INTO validations (application_id, validator_id, action, checklist, notes)
      VALUES (:application_id, :validator_id, :action, :checklist, :notes)
    `,
      {
        application_id,
        validator_id: validatorId,
        action,
        checklist: checklist ? JSON.stringify(checklist) : null,
        notes: notes ?? null,
      },
    );

    // ── Update application status ─────────────────────────────────────────────
    await execute(
      "UPDATE applications SET status = :status, remarks = :remarks WHERE id = :id",
      { status: nextStatus, remarks: notes ?? null, id: application_id },
    );

    // ── Decrement available slots when approved ───────────────────────────────
    if (action === "approved") {
      await execute(
        "UPDATE scholarships SET slots_available = GREATEST(slots_available - 1, 0) WHERE id = (SELECT scholarship_id FROM applications WHERE id = :id)",
        { id: application_id },
      );
    }

    return NextResponse.json({
      message: `Application ${nextStatus} successfully`,
      application_id,
      new_status: nextStatus,
    });
  } catch (err) {
    console.error("[PUT /api/validations]", err);
    return NextResponse.json(
      { error: "Failed to update validation" },
      { status: 500 },
    );
  }
}
