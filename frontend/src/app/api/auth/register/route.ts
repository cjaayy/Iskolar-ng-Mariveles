/**
 * app/api/auth/register/route.ts
 *
 * POST /api/auth/register — register a new applicant using a pre-registration token.
 * Validates the token, creates a user + applicant record, increments usage counter.
 */
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@db/connection";

interface TokenRow {
  id: number;
  token: string;
  max_uses: number;
  times_used: number;
  expires_at: Date | null;
  is_active: boolean;
}

export async function POST(req: NextRequest) {
  const conn = await pool.getConnection();
  try {
    const body = await req.json();
    const {
      token,
      email,
      password,
      fullName,
      studentNumber,
      dateOfBirth,
      course,
      college,
    } = body as {
      token: string;
      email: string;
      password: string;
      fullName: string;
      studentNumber: string;
      dateOfBirth: string;
      course: string;
      college: string;
    };

    // Validate required fields
    if (
      !token ||
      !email ||
      !password ||
      !fullName ||
      !studentNumber ||
      !dateOfBirth ||
      !course ||
      !college
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

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

    // Check if student number already exists
    const [existingStudentRows] = await conn.execute(
      {
        sql: "SELECT id FROM applicants WHERE student_number = ? LIMIT 1",
        namedPlaceholders: false,
      } as import("mysql2").QueryOptions,
      [studentNumber],
    );
    const existingStudents =
      existingStudentRows as import("mysql2").RowDataPacket[];
    if (existingStudents.length > 0) {
      await conn.rollback();
      return NextResponse.json(
        { error: "An account with this student number already exists" },
        { status: 409 },
      );
    }

    // Hash password
    let hash = password;
    try {
      const bcrypt = await import("bcrypt");
      hash = await bcrypt.hash(password, 10);
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
        sql: `INSERT INTO applicants (user_id, student_number, date_of_birth, course, college)
       VALUES (?, ?, ?, ?, ?)`,
        namedPlaceholders: false,
      } as import("mysql2").QueryOptions,
      [userId, studentNumber, dateOfBirth, course, college],
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
        message: "Account created successfully! You can now log in.",
        userId,
        applicantId,
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
