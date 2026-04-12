import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      error: "Barangay access has been deprecated. Use school access instead.",
    },
    { status: 410 },
  );
}
