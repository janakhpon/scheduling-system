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

let memoryStorage: Appointment[] = [];
const DATA_FILE = path.join('/tmp', 'appointments.json');

const readAppointments = (): Appointment[] => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    // fallback to memory
  }
  return memoryStorage;
};

const writeAppointments = (appointments: Appointment[]): void => {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(appointments, null, 2));
  } catch (error) {
    memoryStorage = appointments;
  }
};

export const getAppointments = (): Appointment[] => readAppointments();

export const addAppointment = (appointment: Appointment): void => {
  const appointments = readAppointments();
  appointments.push(appointment);
  writeAppointments(appointments);
};

export const removeAppointment = (id: string): boolean => {
  const appointments = readAppointments();
  const index = appointments.findIndex(a => a.id === id);
  if (index !== -1) {
    appointments.splice(index, 1);
    writeAppointments(appointments);
    return true;
  }
  return false;
};

export const findAppointment = (id: string): Appointment | undefined => 
  readAppointments().find(a => a.id === id);