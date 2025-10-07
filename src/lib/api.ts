import { format, parseISO, addMinutes, isAfter, differenceInMinutes } from 'date-fns';

const API_BASE = (() => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3001/api';
  }
  
  return '/api';
})();

const MAX_RETRIES = 3;
const RETRY_DELAYS = [200, 400, 800];

const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url: string, options: RequestInit, retries: number = MAX_RETRIES): Promise<Response> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      const isLastAttempt = attempt === retries;
      const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
      
      if (isLastAttempt || !isNetworkError) {
        throw error;
      }
      
      const delayMs = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
      await delay(delayMs);
    }
  }
  
  throw new Error('Max retries exceeded');
};

export interface Appointment {
  id: string;
  name: string;
  email: string;
  start: string;
  end: string;
  status: 'AVAILABLE' | 'BOOKED';
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

export const getAppointments = async (dateStr: string): Promise<Appointment[]> => {
  try {
    const response = await fetchWithRetry(`${API_BASE}/appointments?date=${dateStr}`, {
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
};

export const createAppointment = async (data: CreateAppointmentRequest): Promise<Appointment> => {
  try {
    const response = await fetchWithRetry(`${API_BASE}/appointments`, {
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
};

export const deleteAppointment = async (id: string): Promise<{ success: boolean }> => {
  try {
    const response = await fetchWithRetry(`${API_BASE}/appointments/${id}`, {
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
    
    if (response.status === 204) {
      return { success: true };
    }
    
    try {
      return await response.json();
    } catch {
      return { success: true };
    }
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('unexpected error');
  }
};

export const generateTimeSlots = (date: Date): string[] => {
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
};

export const formatTime = (timeString: string): string => {
  const date = parseISO(timeString);
  return format(date, 'h:mm a');
};

export const isPastSlot = (timeString: string): boolean => {
  const slotTime = parseISO(timeString);
  return !isAfter(slotTime, new Date());
};

export const canCancelAppointment = (startTime: string): boolean => {
  const appointmentStart = parseISO(startTime);
  const thirtyMinutesFromNow = addMinutes(new Date(), 30);
  return isAfter(appointmentStart, thirtyMinutesFromNow);
};
