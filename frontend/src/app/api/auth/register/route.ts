/**
 * app/api/auth/register/route.ts
 *
 * POST /api/auth/register — register a new applicant using a pre-registration token.
 * Validates the token, auto-generates a password, creates a user + applicant record,
 * increments usage counter, and returns the generated credentials.
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { pool } from "@db/connection";

interface TokenRow {
  id: number;
  token: string;
  max_uses: number;
  times_used: number;
  expires_at: Date | null;
  is_active: boolean;
}

/** Generate an 8-character alphanumeric password */
function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(8);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

export async function POST(req: NextRequest) {
  const conn = await pool.getConnection();
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

    // Start transaction
    await conn.beginTransaction();

    // Validate registration link
    const [rows] = await conn.execute(
      {
        sql: `SELECT id, token, max_uses, times_used, expires_at, is_active
       FROM registration_links
       WHERE token = ? AND is_active = 1
       LIMIT 1`,
        namedPlaceholders: false,
      } as import("mysql2").QueryOptions,
      [token],
    );
    const linkRows = rows as import("mysql2").RowDataPacket[];
    const link = linkRows[0] as TokenRow | undefined;

    if (!link) {
      await conn.rollback();
      return NextResponse.json(
        { error: "Invalid or expired registration link" },
        { status: 400 },
      );
    }

    // Check expiry
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      await conn.rollback();
      return NextResponse.json(
        { error: "This registration link has expired" },
        { status: 400 },
      );
    }

    // Check usage limit
    if (link.max_uses > 0 && link.times_used >= link.max_uses) {
      await conn.rollback();
      return NextResponse.json(
        { error: "This registration link has reached its maximum usage" },
        { status: 400 },
      );
    }

    // Check if email already exists
    const [existingRows] = await conn.execute(
      {
        sql: "SELECT id FROM users WHERE email = ? LIMIT 1",
        namedPlaceholders: false,
      } as import("mysql2").QueryOptions,
      [email],
    );
    const existingUsers = existingRows as import("mysql2").RowDataPacket[];
    if (existingUsers.length > 0) {
      await conn.rollback();
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    // Hash password
    let hash = plainPassword;
    try {
      const bcrypt = await import("bcrypt");
      hash = await bcrypt.hash(plainPassword, 10);
    } catch {
      // bcrypt not available — store raw (demo only)
    }

    // Create user
    const [userResult] = await conn.execute(
      {
        sql: `INSERT INTO users (email, password_hash, full_name, role)
       VALUES (?, ?, ?, 'applicant')`,
        namedPlaceholders: false,
      } as import("mysql2").QueryOptions,
      [email, hash, fullName],
    );
    const userId = (userResult as import("mysql2").ResultSetHeader).insertId;

    // Create applicant profile
    const [applicantResult] = await conn.execute(
      {
        sql: `INSERT INTO applicants (user_id, address)
       VALUES (?, ?)`,
        namedPlaceholders: false,
      } as import("mysql2").QueryOptions,
      [userId, address],
    );
    const applicantId = (applicantResult as import("mysql2").ResultSetHeader)
      .insertId;

    // Increment usage counter
    await conn.execute(
      {
        sql: `UPDATE registration_links SET times_used = times_used + 1 WHERE id = ?`,
        namedPlaceholders: false,
      } as import("mysql2").QueryOptions,
      [link.id],
    );

    await conn.commit();

    return NextResponse.json(
      {
        message: "Account created successfully!",
        userId,
        applicantId,
        credentials: {
          email,
          password: plainPassword,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    await conn.rollback();
    console.error("[POST /api/auth/register]", err);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 },
    );
  } finally {
    conn.release();
  }
}
