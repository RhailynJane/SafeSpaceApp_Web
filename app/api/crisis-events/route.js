import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Crisis events not yet migrated to Convex - returning empty for now
export async function GET(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Migrate crisis events to Convex
    // For now, return empty array to prevent errors
    return NextResponse.json([], { status: 200 });
  } catch (error) {
    console.error("Error fetching crisis events:", error);
    return NextResponse.json(
      { message: "Error fetching crisis events", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Migrate crisis events to Convex
    return NextResponse.json(
      { message: "Crisis events not yet implemented in Convex" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error creating crisis event:", error);
    return NextResponse.json(
      { message: "Error creating crisis event", error: error.message },
      { status: 500 }
    );
  }
}
