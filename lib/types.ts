export type Role = "elder" | "caretaker" | "family";

export interface Circle {
  id: string; // e.g. "CC-DEMO" or alphanumeric code
  name: string;
  elderName: string;
  elderAge?: number;
  elderConditions?: string[];
  emergencyContact: string;
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: string;
  circleId: string;
  name: string;
  role: Role;
  passcodeHash: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export interface Medication {
  id: string;
  circleId: string;
  name: string;
  dosage: string;
  timesPerDay: number;
  scheduleTimes: string[]; // e.g. ["08:00", "13:00", "20:00"]
  startDate: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD (optional)
  notes: string;
  instructions?: string;
  prescribedBy?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DoseStatus = "scheduled" | "taken" | "missed";

export interface DoseEvent {
  id: string;
  circleId: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string; // ISO timestamp
  scheduledTimeLocal: string; // "08:00"
  scheduledDate: string; // "2026-11-15"
  status: DoseStatus;
  takenAt?: string;
  takenByMemberId?: string;
  takenByMemberName?: string;
  missedReminderElderSent?: boolean;
  missedReminderEscalatedSent?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  circleId: string;
  doctor: string;
  specialty: string;
  dateTime: string; // ISO timestamp
  location: string;
  notes: string;
  reminderSent?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  circleId: string;
  memberId: string;
  memberName: string;
  memberRole: Role;
  action:
    | "MEDICATION_CREATED"
    | "MEDICATION_UPDATED"
    | "MEDICATION_DELETED"
    | "DOSE_TAKEN"
    | "DOSE_MISSED"
    | "APPOINTMENT_CREATED"
    | "APPOINTMENT_UPDATED"
    | "APPOINTMENT_DELETED"
    | "MEMBER_JOINED"
    | "PRESCRIPTION_SCANNED"
    | "CIRCLE_CREATED";
  details: string;
  timestamp: string;
  affectsElder: boolean;
}

export interface SessionUser {
  memberId: string;
  name: string;
  role: Role;
  circleId: string;
  circleName: string;
  elderName: string;
  email: string;
}

export interface ExtractedMedication {
  name: string;
  dosage: string;
  timesPerDay: number;
  scheduleTimes: string[];
  notes: string;
  instructions: string;
  prescribedBy?: string;
  startDate?: string;
  endDate?: string;
}
