import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET → Fetch all real reports from DB
export async function GET() {
  try {
    const reports = await prisma.reports.findMany({
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

// POST → Create a new report with real metrics
export async function POST(request) {
  try {
    const { name, type, data } = await request.json();

    const newReport = await prisma.reports.create({
      data: { name, type, data },
    });

    return NextResponse.json(newReport, { status: 201 });
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
  }
}