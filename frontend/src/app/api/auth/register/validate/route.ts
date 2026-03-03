/**
 * app/api/auth/register/validate/route.ts
 *
 * GET /api/auth/register/validate?token=xxx — check if a registration token is valid.
 * Public endpoint.
 */
import { NextRequest, NextResponse } from "next/server";
import { query } from "@db/connection";

interface TokenRow {
  id: number;
  label: string | null;
  max_uses: number;
  times_used: number;
  expires_at: Date | null;
  is_active: boolean;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json(
      { valid: false, error: "No token provided" },
      { status: 400 },
    );
  }

  try {
    const [link] = await query<TokenRow>(
      `SELECT id, label, max_uses, times_used, expires_at, is_active
       FROM registration_links
       WHERE token = :token
       LIMIT 1`,
      { token },
    );

    if (!link) {
      return NextResponse.json({
        valid: false,
        error: "Invalid registration link",
      });
    }

    if (!link.is_active) {
      return NextResponse.json({
        valid: false,
        error: "This registration link has been deactivated",
      });
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json({
        valid: false,
        error: "This registration link has expired",
      });
    }

    if (link.max_uses > 0 && link.times_used >= link.max_uses) {
      return NextResponse.json({
        valid: false,
        error: "This registration link has reached its maximum usage",
      });
    }

    return NextResponse.json({
      valid: true,
      label: link.label,
    });
  } catch (err) {
    console.error("[GET /api/auth/register/validate]", err);
    return NextResponse.json(
      { valid: false, error: "Failed to validate token" },
      { status: 500 },
    );
  }
}
