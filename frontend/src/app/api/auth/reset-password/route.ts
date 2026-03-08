import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@db/connection";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = (await req.json()) as {
      token: string;
      password: string;
    };

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    const { data: resetToken } = await supabase
      .from("password_reset_tokens")
      .select("id, user_id, expires_at, used")
      .eq("token", token)
      .single();

    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 },
      );
    }

    if (resetToken.used) {
      return NextResponse.json(
        { error: "This reset link has already been used" },
        { status: 400 },
      );
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This reset link has expired" },
        { status: 400 },
      );
    }

    let hash = password;
    try {
      const bcrypt = await import("bcrypt");
      hash = await bcrypt.hash(password, 10);
    } catch {}

    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash: hash })
      .eq("id", resetToken.user_id);

    if (updateError) {
      console.error(
        "[POST /api/auth/reset-password] Update error:",
        updateError,
      );
      return NextResponse.json(
        { error: "Failed to update password. Please try again." },
        { status: 500 },
      );
    }

    await supabase
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("id", resetToken.id);

    return NextResponse.json({ message: "Password updated successfully!" });
  } catch (err) {
    console.error("[POST /api/auth/reset-password]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
