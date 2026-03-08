import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";
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
    const { data: applicant, error: applicantError } = await supabase
      .from("applicants")
      .select("user_id")
      .eq("id", applicantId)
      .limit(1)
      .single();

    if (applicantError || !applicant) {
      return NextResponse.json(
        { error: "Applicant not found" },
        { status: 404 },
      );
    }

    if (body.firstName !== undefined || body.lastName !== undefined) {
      const { data: current, error: userError } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", applicant.user_id)
        .limit(1)
        .single();

      if (userError) {
        throw userError;
      }

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

      const { error: updateUserError } = await supabase
        .from("users")
        .update({ full_name: fullName })
        .eq("id", applicant.user_id);

      if (updateUserError) {
        throw updateUserError;
      }
    }

    const contactNumber =
      body.contactNumber !== undefined
        ? body.contactNumber.trim() || null
        : undefined;
    const address =
      body.address !== undefined
        ? sanitizeText(body.address) || null
        : undefined;

    if (contactNumber !== undefined || address !== undefined) {
      const updates: Record<string, unknown> = {};
      if (contactNumber !== undefined) {
        updates.contact_number = contactNumber;
      }
      if (address !== undefined) {
        updates.address = address;
      }
      if (Object.keys(updates).length > 0) {
        const { error: updateApplicantError } = await supabase
          .from("applicants")
          .update(updates)
          .eq("id", applicantId);

        if (updateApplicantError) {
          throw updateApplicantError;
        }
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
