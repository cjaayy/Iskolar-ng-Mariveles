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
import { query, execute } from "@db/connection";

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
    const [submission] = await query<{
      id: number;
      application_id: number;
      status: string;
    }>(
      "SELECT id, application_id, status FROM requirement_submissions WHERE id = :id LIMIT 1",
      { id: submissionId },
    );

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 },
      );
    }

    // Update submission status + record who validated
    await execute(
      `UPDATE requirement_submissions
       SET status = :status,
           validated_by = :validator_id,
           validated_at = NOW(),
           validator_notes = :notes
       WHERE id = :id`,
      {
        status: action,
        validator_id: Number(validatorId),
        notes: notes ?? null,
        id: submissionId,
      },
    );

    // Check if all requirements for this application are now approved
    const [counts] = await query<{
      total: number;
      approved: number;
      pending: number;
    }>(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending
       FROM requirement_submissions
       WHERE application_id = :application_id`,
      { application_id: submission.application_id },
    );

    // Auto-transition application status if all docs approved
    if (
      counts &&
      Number(counts.total) > 0 &&
      Number(counts.approved) === Number(counts.total)
    ) {
      await execute(
        "UPDATE applications SET status = 'approved', remarks = 'All documents validated' WHERE id = :id AND status IN ('submitted', 'under_review')",
        { id: submission.application_id },
      );
    } else if (action === "rejected") {
      // If any document is rejected, move application to under_review if it was submitted
      await execute(
        "UPDATE applications SET status = 'under_review' WHERE id = :id AND status = 'submitted'",
        { id: submission.application_id },
      );
    }

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

    // Bulk update all pending submissions for this application
    const result = await execute(
      `UPDATE requirement_submissions
       SET status = :status,
           validated_by = :validator_id,
           validated_at = NOW(),
           validator_notes = :notes
       WHERE application_id = :application_id
         AND status = 'pending'`,
      {
        status: action,
        validator_id: Number(validatorId),
        notes: notes ?? null,
        application_id: applicationId,
      },
    );

    // Update application status accordingly
    const newAppStatus = action === "approved" ? "approved" : "under_review";
    await execute(
      "UPDATE applications SET status = :status, remarks = :remarks WHERE id = :id",
      {
        status: newAppStatus,
        remarks:
          notes ??
          (action === "approved"
            ? "All documents approved by staff"
            : "Documents need revision"),
        id: applicationId,
      },
    );

    // Record in validations audit trail
    await execute(
      `INSERT INTO validations (application_id, validator_id, action, notes)
       VALUES (:application_id, :validator_id, :action, :notes)`,
      {
        application_id: applicationId,
        validator_id: Number(validatorId),
        action,
        notes: notes ?? null,
      },
    );

    return NextResponse.json({
      message: `${result.affectedRows} document(s) ${action} successfully`,
      applicationId,
      action,
      affected: result.affectedRows,
    });
  } catch (err) {
    console.error("[POST /api/staff/validate]", err);
    return NextResponse.json(
      { error: "Failed to bulk validate" },
      { status: 500 },
    );
  }
}
