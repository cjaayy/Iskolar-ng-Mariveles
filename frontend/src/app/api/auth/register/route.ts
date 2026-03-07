/**
 * app/api/auth/register/route.ts
 *
 * POST /api/auth/register — register a new applicant using a pre-registration token.
 * Validates the token, auto-generates a password, creates a user + applicant record,
 * increments usage counter, and returns the generated credentials.
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@db/connection";

/** Generate an 8-character alphanumeric password */
function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(8);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, email, fullName, address } = body as {
      token: string;
      email: string;
      fullName: string;
      address: string;
    };

    // Validate required fields
    if (!token || !email || !fullName || !address) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    // Auto-generate password
    const plainPassword = generatePassword();

    // Hash password
    let hash = plainPassword;
    try {
      const bcrypt = await import("bcrypt");
      hash = await bcrypt.hash(plainPassword, 10);
    } catch {
      // bcrypt not available — store raw (demo only)
    }

    // Call the register_applicant RPC (handles validation + insert in a transaction)
    const { data: result, error: rpcError } = await supabase.rpc(
      "register_applicant",
      {
        p_token: token,
        p_email: email,
        p_full_name: fullName,
        p_address: address,
        p_password_hash: hash,
      },
    );

    if (rpcError) {
      console.error("[POST /api/auth/register] RPC error:", rpcError);
      return NextResponse.json(
        { error: "Registration failed. Please try again." },
        { status: 500 },
      );
    }

    // The RPC returns JSON — check for application-level errors
    if (result.error) {
      // Determine appropriate status code based on error message
      let status = 400;
      if (result.error.includes("already exists")) {
        status = 409;
      }
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(
      {
        message: "Account created successfully!",
        userId: result.user_id,
        applicantId: result.applicant_id,
        credentials: {
          email,
          password: plainPassword,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/auth/register]", err);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 },
    );
  }
}
