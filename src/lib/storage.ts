import fs from 'fs';
import path from 'path';

export interface Appointment {
  id: string;
  name: string;
  email: string;
  start: string;
  end: string;
  status: 'AVAILABLE' | 'BOOKED';
  createdAt: string;
}

// fallback in-memory storage - this will be shared across the same function instance
let memoryStorage: Appointment[] = [];

// try /tmp first, fallback to memory
const DATA_FILE = path.join('/tmp', 'appointments.json');

function readAppointments(): Appointment[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    // fallback to memory storage - this is expected on vercel
    if (process.env.NODE_ENV === 'development') {
      console.log('using memory storage fallback');
    }
  }
  return memoryStorage;
}

function writeAppointments(appointments: Appointment[]): void {
  try {
    // ensure directory exists
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(appointments, null, 2));
  } catch (error) {
    // fallback to memory storage
    memoryStorage = appointments;
  }
}

export function getAppointments(): Appointment[] {
  return readAppointments();
}

export function addAppointment(appointment: Appointment): void {
  const appointments = readAppointments();
  appointments.push(appointment);
  writeAppointments(appointments);
}

export function removeAppointment(id: string): boolean {
  const appointments = readAppointments();
  const index = appointments.findIndex(a => a.id === id);
  if (index !== -1) {
    appointments.splice(index, 1);
    writeAppointments(appointments);
    return true;
  }
  return false;
}

export function findAppointment(id: string): Appointment | undefined {
  const appointments = readAppointments();
  return appointments.find(a => a.id === id);
}