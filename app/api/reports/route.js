import { NextResponse } from 'next/server';

// In-memory "database" for demonstration.
let reports = [
    { id: 1, name: "Monthly Caseload Summary", date: "2024-01-15", type: "PDF", size: "2.3 MB", data: { total_clients: 50, new_clients: 5, sessions_held: 120 } },
    { id: 2, name: "Session Outcomes Report", date: "2024-01-10", type: "Excel", size: "1.8 MB", data: { high_risk_decreased: "15%", goals_met: "45%" } },
    { id: 3, name: "Crisis Intervention Log", date: "2024-01-08", type: "PDF", size: "856 KB", data: { crisis_events: 4, average_response_time: "15 mins" } },
];

// GET /api/reports - Fetches all reports
export async function GET() {
  return NextResponse.json(reports);
}

// POST /api/reports - Adds a new report
export async function POST(request) {
    const newReport = await request.json();
    
    const reportToAdd = {
      ...newReport,
      id: reports.length + 1, // Simple ID generation
      date: new Date().toISOString().split('T')[0],
      size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`
    };
    reports.unshift(reportToAdd); // Add to the beginning of the list
    return NextResponse.json(reportToAdd, { status: 201 });
}