import { NextResponse } from 'next/server';

// In-memory "database" for demonstration.
// In a real application, you would use a database like PostgreSQL, MongoDB, etc.
let appointments = [
    {
      id: "1",
      clientName: "Emma Watson",
      date: "2024-05-21",
      time: "10:00",
      type: "Initial Consultation",
      duration: "50 min",
      status: "confirmed",
    },
    {
      id: "2",
      clientName: "David Chen",
      date: new Date().toISOString().split('T')[0], // Today's date for demonstration
      time: "14:00",
      type: "Follow-up session",
      duration: "50 min",
      status: "confirmed",
    },
];

// GET /api/appointments
// GET /api/appointments?date=today
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (date === 'today') {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(appt => appt.date === today);
    return NextResponse.json(todayAppointments);
  }

  return NextResponse.json(appointments);
}

// POST /api/appointments
export async function POST(request) {
    const newAppointment = await request.json();
    
    const appointmentToAdd = {
      ...newAppointment,
      id: (appointments.length + 1).toString(), // Simple ID generation
      status: 'confirmed'
    };
    appointments.push(appointmentToAdd);
    return NextResponse.json(appointmentToAdd, { status: 201 });
}