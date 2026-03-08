import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";

interface MeRow {
  user_id: number;
  email: string;
  full_name: string;
  role: string;
  applicant_id: number;
  contact_number: string | null;
  address: string | null;
}

function profileCompletion(row: MeRow): number {
  const checks = [
    { val: !!row.full_name, weight: 25 },
    { val: !!row.email, weight: 25 },
    { val: !!row.contact_number, weight: 25 },
    { val: !!row.address, weight: 25 },
  ];
  return checks.reduce((sum, c) => sum + (c.val ? c.weight : 0), 0);
}

export async function GET(req: NextRequest) {
  const applicantIdHeader = req.headers.get("x-applicant-id");
  if (!applicantIdHeader) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const applicantId = Number(applicantIdHeader);

  try {
    const { data: applicantRow, error: applicantError } = await supabase
      .from("applicants")
      .select(
        `
        id,
        contact_number,
        address,
        users!inner(id, email, full_name, role)
      `,
      )
      .eq("id", applicantId)
      .limit(1)
      .single();

    if (applicantError || !applicantRow) {
      return NextResponse.json(
        { error: "Applicant not found" },
        { status: 404 },
      );
    }

    const user = applicantRow.users as unknown as {
      id: number;
      email: string;
      full_name: string;
      role: string;
    };

    const row: MeRow = {
      user_id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      applicant_id: applicantRow.id,
      contact_number: applicantRow.contact_number,
      address: applicantRow.address,
    };

    const nameParts = row.full_name.trim().split(/\s+/);
    const firstName = nameParts[0] ?? "";
    const lastName = nameParts.slice(1).join(" ");

    const { data: applications, error: appError } = await supabase
      .from("applications")
      .select("status")
      .eq("applicant_id", applicantId)
      .order("created_at", { ascending: false });

    if (appError) {
      throw appError;
    }

    return NextResponse.json({
      user: {
        userId: row.user_id,
        applicantId: row.applicant_id,
        email: row.email,
        fullName: row.full_name,
        firstName,
        lastName,
        role: row.role,
        contactNumber: row.contact_number,
        address: row.address,
        profileCompletion: profileCompletion(row),
      },
      scholarships: (applications ?? []).map((a: { status: string }) => ({
        name: "Iskolar ng Mariveles",
        grantor: "LGU Mariveles",
        status: ["approved"].includes(a.status) ? "active" : "pending",
        award: "LGU Mariveles",
      })),
    });
  } catch (err) {
    console.error("[GET /api/me]", err);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 },
    );
  }
}
