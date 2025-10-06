import { format, parseISO, addMinutes, isAfter, differenceInMinutes } from 'date-fns';

// detect environment - use local server if running locally, otherwise use relative paths
const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api' 
  : '/api';

export interface Appointment {
  id: string;
  name: string;
  email: string;
  start: string;
  end: string;
  status: 'available' | 'booked';
  createdAt: string;
}

export interface CreateAppointmentRequest {
  name: string;
  email: string;
  start: string;
}

export interface ApiError {
  error: string;
}

export async function getAppointments(dateStr: string): Promise<Appointment[]> {
  try {
    const response = await fetch(`${API_BASE}/appointments?date=${dateStr}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      let errorMessage = 'failed to fetch appointments';
      try {
        const errorData: ApiError = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        if (response.status === 404) errorMessage = 'no appointments found';
        else if (response.status >= 500) errorMessage = 'server error';
        else if (response.status === 400) errorMessage = 'invalid request';
      }
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('unexpected error');
  }
}

export async function createAppointment(data: CreateAppointmentRequest): Promise<Appointment> {
  try {
    const response = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      let errorMessage = 'failed to create appointment';
      try {
        const errorData: ApiError = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        if (response.status === 409) errorMessage = 'time slot booked';
        else if (response.status >= 500) errorMessage = 'server error';
        else if (response.status === 400) errorMessage = 'invalid data';
      }
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('unexpected error');
  }
}

export async function deleteAppointment(id: string): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_BASE}/appointments/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      let errorMessage = 'failed to delete appointment';
      try {
        const errorData: ApiError = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        if (response.status === 404) errorMessage = 'appointment not found';
        else if (response.status === 403) errorMessage = 'too late to cancel';
        else if (response.status >= 500) errorMessage = 'server error';
        else if (response.status === 400) errorMessage = 'invalid id';
      }
      throw new Error(errorMessage);
    }
    
    // handle 204 no content response
    if (response.status === 204) {
      return { success: true };
    }
    
    // try to parse json for other responses
    try {
      return await response.json();
    } catch {
      return { success: true };
    }
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('unexpected error');
  }
}

export function generateTimeSlots(date: Date): string[] {
  const slots: string[] = [];
  for (let hour = 7; hour < 19; hour++) {
    const hourSlot = new Date(date);
    hourSlot.setHours(hour, 0, 0, 0);
    slots.push(hourSlot.toISOString());
    
    if (hour < 18) {
      const halfHourSlot = new Date(date);
      halfHourSlot.setHours(hour, 30, 0, 0);
      slots.push(halfHourSlot.toISOString());
    }
  }
  return slots;
}

export function formatTime(timeString: string): string {
  const date = parseISO(timeString);
  return format(date, 'h:mm a');
}

export function isPastSlot(timeString: string): boolean {
  const slotTime = parseISO(timeString);
  return !isAfter(slotTime, new Date());
}

export function canCancelAppointment(startTime: string): boolean {
  const appointmentStart = parseISO(startTime);
  const thirtyMinutesFromNow = addMinutes(new Date(), 30);
  return isAfter(appointmentStart, thirtyMinutesFromNow);
}
