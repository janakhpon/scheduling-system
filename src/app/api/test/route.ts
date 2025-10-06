import { NextResponse } from 'next/server';
import { getAppointments, addAppointment } from '@/lib/storage';

export async function GET() {
  try {
    const appointments = getAppointments();
    return NextResponse.json({
      status: "ok",
      message: "Storage test successful",
      appointmentCount: appointments.length,
      appointments: appointments,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { 
        status: "error", 
        message: "Storage test failed",
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Add a test appointment
    const testAppointment = {
      id: `test-${Date.now()}`,
      name: 'Test User',
      email: 'test@example.com',
      start: new Date().toISOString(),
      end: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes later
      status: 'BOOKED' as const,
      createdAt: new Date().toISOString()
    };
    
    addAppointment(testAppointment);
    
    return NextResponse.json({
      status: "ok",
      message: "Test appointment created",
      appointment: testAppointment
    });
  } catch (error) {
    console.error('Test POST error:', error);
    return NextResponse.json(
      { 
        status: "error", 
        message: "Test appointment creation failed",
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
