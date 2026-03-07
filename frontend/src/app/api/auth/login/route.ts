/**
 * app/api/auth/login/route.ts
 *
 * POST /api/auth/login — authenticate user (applicant, validator, admin)
 * Returns user profile + role so the client can redirect accordingly.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
  role: "admin" | "validator" | "applicant";
  is_active: boolean;
}

interface ApplicantIdRow {
  id: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Look up user by email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("is_active", true)
      .limit(1)
      .single<UserRow>();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // In production, use bcrypt.compare(). For demo, accept known passwords.
    // Simple check: allow any password for demo purposes (replace with bcrypt in prod)
    let bcrypt: typeof import("bcrypt") | null = null;
    try {
      bcrypt = await import("bcrypt");
    } catch {
      // bcrypt not available — skip hash check for demo
    }

    if (bcrypt) {
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 },
        );
      }
    }

    // Build response based on role
    const response: Record<string, unknown> = {
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    };

    // If applicant, also return applicant ID
    if (user.role === "applicant") {
      const { data: applicant } = await supabase
        .from("applicants")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .single<ApplicantIdRow>();

      response.applicantId = applicant?.id ?? null;

      // Check barangay access — applicants can only login when their barangay is open
      if (applicant) {
        const { data: applicantInfo } = await supabase
          .from("applicants")
          .select("address")
          .eq("id", applicant.id)
          .limit(1)
          .single<{ address: string | null }>();

        const address = applicantInfo?.address || "";
        // Extract barangay from address (format: "Brgy, Mariveles, Bataan" or "Street, Brgy, Mariveles, Bataan")
        const parts = address.split(",").map((p: string) => p.trim());
        const marivIdx = parts.findIndex((p: string) =>
          p.toLowerCase().includes("mariveles"),
        );
        const brgy = marivIdx > 0 ? parts[marivIdx - 1] : parts[0] || "";

        if (brgy) {
          const { data: access } = await supabase
            .from("barangay_access")
            .select("is_open")
            .eq("barangay", brgy)
            .limit(1)
            .single<{ is_open: boolean }>();

          if (access && !access.is_open) {
            return NextResponse.json(
              {
                error: `Access for Barangay ${brgy} is currently closed. Please wait for your scheduled date.`,
              },
              { status: 403 },
            );
          }
        }
      }
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error("[POST /api/auth/login]", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
