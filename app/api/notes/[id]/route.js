// app/api/notes/[id]/route.js
import { NextResponse } from 'next/server';

// GET a single note by ID
export async function GET() { return NextResponse.json({ message: 'Notes API deprecated. Use Convex.' }, { status: 410 }); }

// PUT (update) a note by ID
export async function PUT() { return NextResponse.json({ message: 'Notes API deprecated. Use Convex.' }, { status: 410 }); }

// DELETE a note by ID
export async function DELETE() { return NextResponse.json({ message: 'Notes API deprecated. Use Convex.' }, { status: 410 }); }
