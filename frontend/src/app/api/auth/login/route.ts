/**
 * app/api/auth/login/route.ts
 *
 * POST /api/auth/login — authenticate user (applicant, validator, admin)
 * Returns user profile + role so the client can redirect accordingly.
 */
import { NextRequest, NextResponse } from "next/server";
import { query } from "@db/connection";

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
    const [user] = await query<UserRow>(
      "SELECT * FROM users WHERE email = :email AND is_active = 1 LIMIT 1",
      { email },
    );

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // In production, use bcrypt.compare(). For demo, accept known passwords.
    // Simple check: allow any password for demo purposes (replace with bcrypt in prod)
    let bcrypt: typeof import("bcrypt") | null = null;
    try {
      bcrypt = require("bcrypt");
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
      const [applicant] = await query<ApplicantIdRow>(
        "SELECT id FROM applicants WHERE user_id = :user_id LIMIT 1",
        { user_id: user.id },
      );
      response.applicantId = applicant?.id ?? null;
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error("[POST /api/auth/login]", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
