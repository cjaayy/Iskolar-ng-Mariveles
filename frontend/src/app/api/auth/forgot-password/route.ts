import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@db/connection";
import { sendPasswordResetEmail } from "@/lib/sendEmail";

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email: string };

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { data: user } = await supabase
      .from("users")
      .select("id, full_name, email")
      .eq("email", email)
      .single();

    if (!user) {
      return NextResponse.json({
        message:
          "If an account with that email exists, a reset link has been sent.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase
      .from("password_reset_tokens")
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error(
        "[POST /api/auth/forgot-password] Insert error:",
        insertError,
      );
      return NextResponse.json(
        { error: "Failed to create reset token. Please try again." },
        { status: 500 },
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${baseUrl}/reset-password/${token}`;

    try {
      await sendPasswordResetEmail(user.email, user.full_name, resetLink);
    } catch (emailErr) {
      console.error("[POST /api/auth/forgot-password] Email error:", emailErr);
      return NextResponse.json(
        { error: "Failed to send email. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message:
        "If an account with that email exists, a reset link has been sent.",
    });
  } catch (err) {
    console.error("[POST /api/auth/forgot-password]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
