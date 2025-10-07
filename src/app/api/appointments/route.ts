import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseISO, isValid, isAfter, addMinutes } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { getAppointments, addAppointment, type Appointment } from '@/lib/storage';

const START_HOUR = parseInt(process.env.START_HOUR || '7');
const END_HOUR = parseInt(process.env.END_HOUR || '19');
const SLOT_MINUTES = parseInt(process.env.SLOT_MINUTES || '30');

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid date format");
const createAppointmentSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email().max(100).toLowerCase().trim(),
  start: z.string().refine((val) => {
    const date = parseISO(val);
    return isValid(date);
  }, "invalid datetime format")
});

const isValidSlot = (startDate: Date): boolean => {
  const hour = startDate.getHours();
  const minute = startDate.getMinutes();
  return hour >= START_HOUR && hour < END_HOUR && minute % SLOT_MINUTES === 0;
};

const hasOverlap = (startISO: string): boolean => {
  const appointments = getAppointments();
  const startTime = parseISO(startISO);
  const endTime = addMinutes(startTime, SLOT_MINUTES);
  return appointments.some((a) => {
    if (a.status !== 'BOOKED') return false;
    const aStart = parseISO(a.start);
    const aEnd = parseISO(a.end);
    return Math.max(aStart.getTime(), startTime.getTime()) < Math.min(aEnd.getTime(), endTime.getTime());
  });
};

const sendError = (message: string, statusCode: number = 400) => 
  NextResponse.json({ error: message, statusCode }, { status: statusCode });

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    if (!date) return sendError("date required", 400);

    const dateValidation = dateSchema.safeParse(date);
    if (!dateValidation.success) return sendError("invalid date format", 400);

    const testDate = parseISO(date + 'T00:00:00');
    if (!isValid(testDate)) return sendError("invalid date", 400);

    const appointments = getAppointments();
    const dayAppointments = appointments.filter((a) => 
      a.start.startsWith(date) && a.status === 'BOOKED'
    );
    
    return NextResponse.json(dayAppointments);
  } catch (error) {
    console.error('get error:', error);
    return sendError("server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validation = createAppointmentSchema.safeParse(body);
    if (!validation.success) {
      return sendError(`invalid data: ${validation.error.errors.map(e => e.message).join(', ')}`, 400);
    }

    const { name, email, start } = validation.data;
    const startDate = parseISO(start);

    if (!isAfter(startDate, new Date())) return sendError("cannot book past", 400);
    if (!isValidSlot(startDate)) return sendError("invalid time slot", 400);
    if (hasOverlap(start)) return sendError("slot booked", 409);

    const endDate = addMinutes(startDate, SLOT_MINUTES);
    const newAppointment: Appointment = {
      id: uuidv4(),
      name,
      email,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      status: 'BOOKED',
      createdAt: new Date().toISOString(),
    };

    addAppointment(newAppointment);
    return NextResponse.json(newAppointment, { status: 201 });
  } catch (error) {
    console.error('post error:', error);
    return sendError("server error", 500);
  }
}
