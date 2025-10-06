import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseISO, isValid, differenceInMinutes } from 'date-fns';
import { findAppointment, removeAppointment, type Appointment } from '@/lib/storage';

const SLOT_MINUTES = parseInt(process.env.SLOT_MINUTES || '30');
const appointmentIdSchema = z.string().uuid();

function sendError(message: string, statusCode: number = 400) {
  return NextResponse.json({ error: message, statusCode }, { status: statusCode });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('delete request for id:', id);
    
    const idValidation = appointmentIdSchema.safeParse(id);
    if (!idValidation.success) return sendError("invalid id", 400);

    const appointment = findAppointment(id);
    console.log('found appointment:', appointment);
    if (!appointment) return sendError("not found", 404);
    if (appointment.status !== 'booked') return sendError("not active", 400);

    const start = parseISO(appointment.start);
    if (!isValid(start)) return sendError("invalid date", 400);

    const timeUntilStart = differenceInMinutes(start, new Date());
    if (timeUntilStart < SLOT_MINUTES) return sendError("too late to cancel", 403);

    const success = removeAppointment(id);
    console.log('removal success:', success);
    if (!success) return sendError("failed to remove", 500);
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('delete error:', error);
    return sendError("server error", 500);
  }
}
