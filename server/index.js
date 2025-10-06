// server.js
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const { z } = require("zod");
const {
  format,
  parseISO,
  isValid,
  isAfter,
  addMinutes,
  differenceInMinutes,
} = require("date-fns");

const app = express();

// Enable CORS for all routes
app.use((req, res, next) => {
  const corsOrigin = process.env.CORS_ORIGIN || "*";
  res.header("Access-Control-Allow-Origin", corsOrigin);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(bodyParser.json());

// Config from env
const PORT = process.env.PORT || 3001;
const START_HOUR = parseInt(process.env.START_HOUR) || 7;
const END_HOUR = parseInt(process.env.END_HOUR) || 19;
const SLOT_MINUTES = parseInt(process.env.SLOT_MINUTES) || 30;

// In-memory storage
const appointments = [];

// Simple status constants - only available or booked
const SLOT_STATUS = {
  AVAILABLE: "AVAILABLE",
  BOOKED: "BOOKED",
};

// Zod schemas for validation
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Expected YYYY-MM-DD");

const createAppointmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long").trim(),
  email: z
    .string()
    .email("Invalid email format")
    .max(100, "Email too long")
    .toLowerCase()
    .trim(),
  start: z.string().datetime("Invalid datetime format"),
});

const appointmentIdSchema = z.string().uuid("Invalid appointment ID format");

// --- Helpers ---
function isValidSlot(startDate) {
  const hour = startDate.getHours();
  const minute = startDate.getMinutes();

  return (
    hour >= START_HOUR &&
    (hour < END_HOUR ||
      (hour === END_HOUR - 1 && minute === 60 - SLOT_MINUTES)) &&
    minute % SLOT_MINUTES === 0
  );
}

function hasOverlap(startISO) {
  const startTime = parseISO(startISO);
  const endTime = addMinutes(startTime, SLOT_MINUTES);

  return appointments.some((a) => {
    // Only check booked appointments (not cancelled ones)
    if (a.status !== SLOT_STATUS.BOOKED) {
      return false;
    }
    const aStart = parseISO(a.start);
    const aEnd = parseISO(a.end);
    return (
      Math.max(aStart.getTime(), startTime.getTime()) <
      Math.min(aEnd.getTime(), endTime.getTime())
    );
  });
}

function sendError(res, message, statusCode = 400) {
  res.status(statusCode).json({ error: message, statusCode });
}

// --- Routes ---
// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// GET appointments for a date
app.get("/api/appointments", (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return sendError(
        res,
        "Date parameter is required (YYYY-MM-DD format)",
        400
      );
    }

    // Validate date format using Zod
    const dateValidation = dateSchema.safeParse(date);
    if (!dateValidation.success) {
      return sendError(res, dateValidation.error.errors[0].message, 400);
    }

    // Validate that the date is valid
    const testDate = parseISO(date + "T00:00:00");
    if (!isValid(testDate)) {
      return sendError(res, "Invalid date", 400);
    }

    // Only return booked appointments (active ones)
    const dayAppointments = appointments.filter(
      (a) => a.start.startsWith(date) && a.status === SLOT_STATUS.BOOKED
    );

    res.json(dayAppointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    sendError(res, "Internal server error", 500);
  }
});

// POST new appointment
app.post("/api/appointments", (req, res) => {
  try {
    // Validate request body using Zod
    const validation = createAppointmentSchema.safeParse(req.body);
    if (!validation.success) {
      return sendError(res, validation.error.errors[0].message, 400);
    }

    const { name, email, start } = validation.data;
    const startDate = parseISO(start);

    // Check if appointment is in the past
    const now = new Date();
    if (!isAfter(startDate, now)) {
      return sendError(res, "Cannot book appointments in the past", 400);
    }

    // Check if slot is valid (within operating hours and proper interval)
    if (!isValidSlot(startDate)) {
      return sendError(
        res,
        `Invalid time slot. Appointments must be on the hour or half-hour between ${START_HOUR}:00 AM and ${
          END_HOUR - 1
        }:30 PM`,
        400
      );
    }

    // Check for overlaps (idempotent check)
    if (hasOverlap(start)) {
      return sendError(res, "Time slot is already booked", 409);
    }

    const endDate = addMinutes(startDate, SLOT_MINUTES);
    const newAppointment = {
      id: uuidv4(),
      name,
      email,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      status: SLOT_STATUS.BOOKED,
      createdAt: new Date().toISOString(),
    };

    appointments.push(newAppointment);
    res.status(201).json(newAppointment);
  } catch (error) {
    console.error("Error creating appointment:", error);
    sendError(res, "Internal server error", 500);
  }
});

// DELETE appointment (hard delete - remove from array)
app.delete("/api/appointments/:id", (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format using Zod
    const idValidation = appointmentIdSchema.safeParse(id);
    if (!idValidation.success) {
      return sendError(res, idValidation.error.errors[0].message, 400);
    }

    const index = appointments.findIndex((a) => a.id === id);
    if (index === -1) {
      return sendError(res, "Appointment not found", 404);
    }

    const appointment = appointments[index];

    // Check if appointment is already cancelled (idempotent check)
    if (appointment.status !== SLOT_STATUS.BOOKED) {
      return sendError(res, "Appointment is not active", 400);
    }

    const now = new Date();
    const start = parseISO(appointment.start);

    // Validate date
    if (!isValid(start)) {
      return sendError(res, "Invalid appointment date", 400);
    }

    // Check cancellation policy (30-minute rule)
    const timeUntilStart = differenceInMinutes(start, now);
    if (timeUntilStart < SLOT_MINUTES) {
      return sendError(
        res,
        `Cannot cancel within ${SLOT_MINUTES} minutes of start time. Appointment starts in ${timeUntilStart} minutes.`,
        403
      );
    }

    // Remove appointment from array (hard delete)
    appointments.splice(index, 1);

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting appointment:", error);
    sendError(res, "Internal server error", 500);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📅 Business hours: ${START_HOUR}:00 - ${END_HOUR}:00`);
  console.log(`⏰ Slot duration: ${SLOT_MINUTES} minutes`);
  console.log(`🌐 CORS origin: ${process.env.CORS_ORIGIN || "*"}`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
});
