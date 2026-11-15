import { z } from "zod";

export const RoleEnum = z.enum(["elder", "caretaker", "family"]);

export const createCircleSchema = z.object({
  elderName: z.string().min(2, "Elder name must be at least 2 characters").max(100),
  elderAge: z.coerce.number().min(50).max(125).optional(),
  elderConditions: z.array(z.string()).optional().default([]),
  circleName: z.string().min(2, "Circle name must be at least 2 characters").max(100),
  elderPasscode: z.string().min(4, "Passcode must be at least 4 digits").max(20),
  elderEmail: z.string().email("Valid elder email required"),
  creatorName: z.string().min(2, "Your name must be at least 2 characters"),
  creatorRole: RoleEnum,
  creatorPasscode: z.string().min(4, "Your passcode must be at least 4 digits"),
  creatorEmail: z.string().email("Valid email required"),
  emergencyContact: z.string().min(3, "Emergency contact name/phone required"),
});

export const joinCircleSchema = z.object({
  circleId: z.string().min(3, "Circle ID is required").toUpperCase(),
  memberName: z.string().min(2, "Name must be at least 2 characters"),
  role: RoleEnum,
  passcode: z.string().min(4, "Passcode must be at least 4 digits"),
  email: z.string().email("Valid email required for notifications"),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  circleId: z.string().min(3, "Circle ID is required").toUpperCase(),
  role: RoleEnum,
  passcode: z.string().min(4, "Passcode must be at least 4 digits"),
});

export const medicationSchema = z.object({
  name: z.string().min(2, "Medication name must be at least 2 characters").max(100),
  dosage: z.string().min(1, "Dosage is required (e.g. 10mg, 1 tablet)").max(50),
  timesPerDay: z.coerce.number().int().min(1, "Must be at least 1 time per day").max(6, "Maximum 6 times per day"),
  scheduleTimes: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM format")).min(1, "At least one scheduled time required"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be YYYY-MM-DD").optional().or(z.literal("")),
  notes: z.string().max(500).default(""),
  instructions: z.string().max(500).optional().default(""),
  prescribedBy: z.string().max(100).optional().default(""),
  active: z.boolean().default(true),
});

export const appointmentSchema = z.object({
  doctor: z.string().min(2, "Doctor name is required").max(100),
  specialty: z.string().min(2, "Specialty is required (e.g. Cardiology)").max(100),
  dateTime: z.string().min(10, "Valid date and time required"),
  location: z.string().min(2, "Location or clinic name is required").max(200),
  notes: z.string().max(500).optional().default(""),
});

export const doseUpdateSchema = z.object({
  doseEventId: z.string().min(1, "Dose Event ID is required"),
  status: z.enum(["scheduled", "taken", "missed"]),
});

export type CreateCircleInput = z.infer<typeof createCircleSchema>;
export type JoinCircleInput = z.infer<typeof joinCircleSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type MedicationInput = z.infer<typeof medicationSchema>;
export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type DoseUpdateInput = z.infer<typeof doseUpdateSchema>;
