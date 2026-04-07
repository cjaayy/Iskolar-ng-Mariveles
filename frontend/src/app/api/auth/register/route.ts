import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@db/connection";
import { sendCredentialsEmail } from "@/lib/sendEmail";

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(8);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

interface ManualRegisterParams {
  token: string;
  email: string;
  fullName: string;
  address: string;
  passwordHash: string;
  barangay?: string;
  currentSchool?: string;
  yearLevel?: string;
  houseStreet?: string;
}

interface ManualRegisterResult {
  data?: { user_id: number; applicant_id: number; email: string };
  error?: string;
  status?: number;
}

async function manualRegister(
  params: ManualRegisterParams,
): Promise<ManualRegisterResult> {
  const {
    token,
    email,
    fullName,
    address,
    passwordHash,
    barangay,
    currentSchool,
    yearLevel,
    houseStreet,
  } = params;

  const { data: link, error: linkError } = await supabase
    .from("registration_links")
    .select("id, max_uses, times_used, expires_at")
    .eq("token", token)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (linkError || !link) {
    return { error: "Invalid or expired registration link", status: 400 };
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return { error: "This registration link has expired", status: 400 };
  }

  if (link.max_uses > 0 && link.times_used >= link.max_uses) {
    return {
      error: "This registration link has reached its maximum usage",
      status: 400,
    };
  }

  const { data: existing, error: existingError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .limit(1)
    .maybeSingle();

  if (existingError) {
    return { error: "Registration failed. Please try again.", status: 500 };
  }

  if (existing) {
    return { error: "An account with this email already exists", status: 409 };
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .insert({
      email,
      password_hash: passwordHash,
      full_name: fullName,
      role: "applicant",
    })
    .select("id")
    .single();

  if (userError || !user) {
    return { error: "Registration failed. Please try again.", status: 500 };
  }

  const cleanupUser = async () => {
    await supabase.from("users").delete().eq("id", user.id);
  };

  const { data: applicant, error: applicantError } = await supabase
    .from("applicants")
    .insert({
      user_id: user.id,
      address,
      house_street: houseStreet || null,
      town: "Mariveles",
      barangay: barangay || null,
      current_school: currentSchool || null,
      year_level: yearLevel || null,
    })
    .select("id")
    .single();

  if (applicantError || !applicant) {
    await cleanupUser();
    return { error: "Registration failed. Please try again.", status: 500 };
  }

  const { error: appError } = await supabase
    .from("applications")
    .insert({ applicant_id: applicant.id, status: "submitted" });

  if (appError) {
    await cleanupUser();
    return { error: "Registration failed. Please try again.", status: 500 };
  }

  const { error: linkUpdateError } = await supabase
    .from("registration_links")
    .update({ times_used: link.times_used + 1 })
    .eq("id", link.id);

  if (linkUpdateError) {
    await cleanupUser();
    return { error: "Registration failed. Please try again.", status: 500 };
  }

  return {
    data: { user_id: user.id, applicant_id: applicant.id, email },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      token,
      email,
      fullName,
      address,
      houseStreet,
      barangay,
      currentSchool,
      yearLevel,
    } = body as {
      token: string;
      email: string;
      fullName: string;
      address: string;
      houseStreet?: string;
      barangay?: string;
      currentSchool?: string;
      yearLevel?: string;
    };

    if (!token || !email || !fullName || !address) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    const plainPassword = generatePassword();

    let hash = plainPassword;
    try {
      const bcrypt = await import("bcrypt");
      hash = await bcrypt.hash(plainPassword, 10);
    } catch {}

    const isMissingFunction = (err: { code?: string; message?: string }) => {
      const code = err.code || "";
      const msg = (err.message || "").toLowerCase();
      if (code === "PGRST202" || code === "42883") return true;
      if (!msg.includes("register_applicant")) return false;
      return msg.includes("could not find") || msg.includes("does not exist");
    };

    const payload = {
      p_token: token,
      p_email: email,
      p_full_name: fullName,
      p_address: address,
      p_password_hash: hash,
      p_barangay: barangay || null,
      p_current_school: currentSchool || null,
      p_year_level: yearLevel || null,
      p_house_street: houseStreet || null,
    };

    let { data: result, error: rpcError } = await supabase.rpc(
      "register_applicant",
      payload,
    );

    if (rpcError && isMissingFunction(rpcError)) {
      const manual = await manualRegister({
        token,
        email,
        fullName,
        address,
        passwordHash: hash,
        barangay,
        currentSchool,
        yearLevel,
        houseStreet,
      });

      if (manual.error) {
        return NextResponse.json(
          { error: manual.error },
          { status: manual.status ?? 400 },
        );
      }

      result = manual.data;
      rpcError = null;
    }

    if (rpcError) {
      console.error("[POST /api/auth/register] RPC error:", rpcError);
      return NextResponse.json(
        { error: "Registration failed. Please try again." },
        { status: 500 },
      );
    }

    if (result.error) {
      let status = 400;
      if (result.error.includes("already exists")) {
        status = 409;
      }
      return NextResponse.json({ error: result.error }, { status });
    }

    try {
      await sendCredentialsEmail(email, fullName, {
        email,
        password: plainPassword,
      });
    } catch (emailErr) {
      console.error("[POST /api/auth/register] Email send error:", emailErr);
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
