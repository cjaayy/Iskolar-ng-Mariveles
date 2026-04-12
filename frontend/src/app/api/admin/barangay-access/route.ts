import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error:
        "Barangay access has been deprecated. Use /api/admin/school-access instead.",
    },
    { status: 410 },
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      error:
        "Barangay access has been deprecated. Use /api/admin/school-access instead.",
    },
    { status: 410 },
  );
}
