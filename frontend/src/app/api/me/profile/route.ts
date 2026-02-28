/**
 * app/api/me/profile/route.ts
 *
 * PUT /api/me/profile — update editable profile fields.
 */
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@db/connection";
import { sanitizeText } from "@db/eligibility";

interface ProfileBody {
  firstName?: string;
  lastName?: string;
  contactNumber?: string;
  address?: string;
}

export async function PUT(req: NextRequest) {
  const applicantIdHeader = req.headers.get("x-applicant-id");
  if (!applicantIdHeader) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const applicantId = Number(applicantIdHeader);

  let body: ProfileBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    // Resolve user_id
    const [applicant] = await query<{ user_id: number }>(
      "SELECT user_id FROM applicants WHERE id = :id LIMIT 1",
      { id: applicantId },
    );
    if (!applicant) {
      return NextResponse.json(
        { error: "Applicant not found" },
        { status: 404 },
      );
    }

    // Update full_name in users table
    if (body.firstName !== undefined || body.lastName !== undefined) {
      const [current] = await query<{ full_name: string }>(
        "SELECT full_name FROM users WHERE id = :id LIMIT 1",
        { id: applicant.user_id },
      );
      const parts = (current?.full_name ?? "").trim().split(/\s+/);
      const newFirst =
        body.firstName !== undefined
          ? sanitizeText(body.firstName)
          : (parts[0] ?? "");
      const newLast =
        body.lastName !== undefined
          ? sanitizeText(body.lastName)
          : parts.slice(1).join(" ");
      const fullName =
        [newFirst, newLast].filter(Boolean).join(" ") || current?.full_name;

      await execute("UPDATE users SET full_name = :name WHERE id = :id", {
        name: fullName,
        id: applicant.user_id,
      });
    }

    // Update applicant contact fields
    const contactNumber =
      body.contactNumber !== undefined
        ? body.contactNumber.trim() || null
        : undefined;
    const address =
      body.address !== undefined
        ? sanitizeText(body.address) || null
        : undefined;

    if (contactNumber !== undefined || address !== undefined) {
      const sets: string[] = [];
      const params: Record<string, unknown> = { id: applicantId };
      if (contactNumber !== undefined) {
        sets.push("contact_number = :phone");
        params.phone = contactNumber;
      }
      if (address !== undefined) {
        sets.push("address = :address");
        params.address = address;
      }
      if (sets.length > 0) {
        await execute(
          `UPDATE applicants SET ${sets.join(", ")} WHERE id = :id`,
          params,
        );
      }
    }

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("[PUT /api/me/profile]", err);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
