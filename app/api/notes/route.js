import { NextResponse } from "next/server";

// This route is deprecated. Notes are handled by Convex now.
export async function GET() {
  return NextResponse.json({ message: "Notes API deprecated. Use Convex." }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ message: "Notes API deprecated. Use Convex." }, { status: 410 });
}
