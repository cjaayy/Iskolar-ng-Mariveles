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

    let bcrypt: typeof import("bcrypt") | null = null;
    try {
      bcrypt = await import("bcrypt");
    } catch {}

    if (bcrypt) {
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 },
        );
      }
    }

    const response: Record<string, unknown> = {
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    };

    if (user.role === "applicant") {
      const { data: applicant } = await supabase
        .from("applicants")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .single<ApplicantIdRow>();

      response.applicantId = applicant?.id ?? null;

      if (applicant) {
        // Get applicant's school info
        const { data: applicantInfo } = await supabase
          .from("applicants")
          .select("current_school")
          .eq("id", applicant.id)
          .limit(1)
          .single<{ current_school: string | null }>();

        const school = applicantInfo?.current_school || "";

        if (school) {
          const { data: access } = await supabase
            .from("school_access")
            .select("is_open")
            .eq("school_name", school)
            .limit(1)
            .single<{ is_open: boolean }>();

          if (access && !access.is_open) {
            return NextResponse.json(
              {
                error: `Access for ${school} is currently closed. Please wait for your scheduled date.`,
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
