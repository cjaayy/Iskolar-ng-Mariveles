/**
 * app/api/test-db/route.ts
 *
 * GET /api/test-db — verifies the MySQL connection from the browser / curl.
 * Remove or protect this route in production!
 */
import { NextResponse } from "next/server";
import { testConnection, query } from "@db/connection";

export async function GET() {
  // Block access in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 },
    );
  }

  try {
    await testConnection();

    // Light sanity query
    const [row] = await query<{ db: string; now: string; version: string }>(`
      SELECT DATABASE() AS db, NOW() AS now, VERSION() AS version
    `);

    // Table row counts
    const tables = [
      "users",
      "applicants",
      "scholarships",
      "applications",
      "validations",
    ];
    const counts: Record<string, number> = {};
    for (const t of tables) {
      const [r] = await query<{ n: number }>(
        `SELECT COUNT(*) AS n FROM \`${t}\``,
      );
      counts[t] = r.n;
    }

    return NextResponse.json({
      status: "ok",
      database: row.db,
      now: row.now,
      version: row.version,
      row_counts: counts,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[GET /api/test-db]", message);
    return NextResponse.json({ status: "error", message }, { status: 503 });
  }
}
