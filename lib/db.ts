import fs from "fs";
import path from "path";
import * as admin from "firebase-admin";
import bcrypt from "bcryptjs";
import {
  Circle,
  Member,
  Medication,
  DoseEvent,
  Appointment,
  ActivityLog,
  Role,
} from "./types";

// ==========================================
// 1. Firebase Admin Initialization (Firestore)
// ==========================================
let firestoreDb: admin.firestore.Firestore | null = null;
let useFirebase = false;

function initFirestore(): admin.firestore.Firestore | null {
  if (firestoreDb) return firestoreDb;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  // Handle escaped \n in the private key as required
  const privateKey = rawPrivateKey?.replace(/\\n/g, "\n");

  // If any required Firestore credential is missing, gracefully fall back to in-memory store
  if (!projectId || !clientEmail || !privateKey) {
    // Only log once
    if (!(globalThis as any).__carecircle_db_logged) {
      console.log(
        "[CareCircle DB] Firebase credentials missing or partial (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). Using in-memory store with seeded demo data (Vercel & Judge ready)."
      );
      (globalThis as any).__carecircle_db_logged = true;
    }
    return null;
  }

  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }
    firestoreDb = admin.firestore();
    useFirebase = true;
    console.log(`[CareCircle DB] Connected to Google Cloud Firestore (Project: ${projectId})`);
    return firestoreDb;
  } catch (err) {
    console.warn(
      "[CareCircle DB] Firebase initialization failed, falling back to in-memory store with demo data:",
      err
    );
    return null;
  }
}

// Attempt initialization once at module load
initFirestore();

// ==========================================
// 2. In-Memory Store with Demo Data (Zero-Crash Fallback)
// ==========================================
interface StoreSchema {
  circles: Record<string, Circle>;
  members: Record<string, Member>;
  medications: Record<string, Medication>;
  doseEvents: Record<string, DoseEvent>;
  appointments: Record<string, Appointment>;
  activityLogs: Record<string, ActivityLog>;
}

function getInitialDemoData(): StoreSchema {
  const salt = bcrypt.genSaltSync(10);
  const now = new Date().toISOString();
  const today = new Date().toISOString().split("T")[0];

  const circle: Circle = {
    id: "CC-DEMO",
    name: "Jenkins Family Circle",
    elderName: "Margaret Jenkins",
    elderAge: 78,
    elderConditions: ["Hypertension", "Type 2 Diabetes", "Mild Osteoarthritis"],
    emergencyContact: "Sarah Jenkins: +1 (555) 234-5678",
    createdAt: now,
    updatedAt: now,
  };

  const members: Record<string, Member> = {
    "mem-elder": {
      id: "mem-elder",
      circleId: "CC-DEMO",
      name: "Margaret Jenkins",
      role: "elder",
      passcodeHash: bcrypt.hashSync("1234", salt),
      email: "margaret.demo@carecircle.app",
      createdAt: now,
    },
    "mem-caretaker": {
      id: "mem-caretaker",
      circleId: "CC-DEMO",
      name: "Sarah Jenkins",
      role: "caretaker",
      passcodeHash: bcrypt.hashSync("5678", salt),
      email: "sarah.demo@carecircle.app",
      phone: "+1 (555) 234-5678",
      createdAt: now,
    },
    "mem-family": {
      id: "mem-family",
      circleId: "CC-DEMO",
      name: "David Jenkins",
      role: "family",
      passcodeHash: bcrypt.hashSync("9999", salt),
      email: "david.demo@carecircle.app",
      createdAt: now,
    },
  };

  const medications: Record<string, Medication> = {
    "med-1": {
      id: "med-1",
      circleId: "CC-DEMO",
      name: "Amlodipine",
      dosage: "5mg (1 tablet)",
      timesPerDay: 1,
      scheduleTimes: ["08:00"],
      startDate: today,
      notes: "Take with breakfast. For blood pressure control.",
      instructions: "Take once daily in the morning with a full glass of water.",
      prescribedBy: "Dr. Evelyn Thorne (Cardiology)",
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    "med-2": {
      id: "med-2",
      circleId: "CC-DEMO",
      name: "Metformin",
      dosage: "500mg (1 tablet)",
      timesPerDay: 2,
      scheduleTimes: ["08:30", "20:00"],
      startDate: today,
      notes: "Take with food to minimize stomach upset.",
      instructions: "Twice daily after meals for blood glucose management.",
      prescribedBy: "Dr. Evelyn Thorne",
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    "med-3": {
      id: "med-3",
      circleId: "CC-DEMO",
      name: "Glucosamine & Chondroitin",
      dosage: "1500mg",
      timesPerDay: 1,
      scheduleTimes: ["13:00"],
      startDate: today,
      notes: "Joint supplement with lunch.",
      instructions: "Supports joint mobility.",
      prescribedBy: "Dr. Marcus Vance",
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    "med-4": {
      id: "med-4",
      circleId: "CC-DEMO",
      name: "Atorvastatin",
      dosage: "20mg (1 tablet)",
      timesPerDay: 1,
      scheduleTimes: ["21:00"],
      startDate: today,
      notes: "Evening dose before bedtime.",
      instructions: "Take every night for lipid control.",
      prescribedBy: "Dr. Evelyn Thorne",
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  };

  const doseEvents: Record<string, DoseEvent> = {
    "dose-1": {
      id: "dose-1",
      circleId: "CC-DEMO",
      medicationId: "med-1",
      medicationName: "Amlodipine",
      dosage: "5mg (1 tablet)",
      scheduledTime: `${today}T08:00:00.000Z`,
      scheduledTimeLocal: "08:00",
      scheduledDate: today,
      status: "taken",
      takenAt: `${today}T08:05:00.000Z`,
      takenByMemberId: "mem-elder",
      takenByMemberName: "Margaret Jenkins",
      createdAt: now,
      updatedAt: now,
    },
    "dose-2": {
      id: "dose-2",
      circleId: "CC-DEMO",
      medicationId: "med-2",
      medicationName: "Metformin",
      dosage: "500mg (1 tablet)",
      scheduledTime: `${today}T08:30:00.000Z`,
      scheduledTimeLocal: "08:30",
      scheduledDate: today,
      status: "taken",
      takenAt: `${today}T08:35:00.000Z`,
      takenByMemberId: "mem-elder",
      takenByMemberName: "Margaret Jenkins",
      createdAt: now,
      updatedAt: now,
    },
    "dose-3": {
      id: "dose-3",
      circleId: "CC-DEMO",
      medicationId: "med-3",
      medicationName: "Glucosamine & Chondroitin",
      dosage: "1500mg",
      scheduledTime: `${today}T13:00:00.000Z`,
      scheduledTimeLocal: "13:00",
      scheduledDate: today,
      status: "scheduled",
      createdAt: now,
      updatedAt: now,
    },
    "dose-4": {
      id: "dose-4",
      circleId: "CC-DEMO",
      medicationId: "med-2",
      medicationName: "Metformin",
      dosage: "500mg (1 tablet)",
      scheduledTime: `${today}T20:00:00.000Z`,
      scheduledTimeLocal: "20:00",
      scheduledDate: today,
      status: "scheduled",
      createdAt: now,
      updatedAt: now,
    },
    "dose-5": {
      id: "dose-5",
      circleId: "CC-DEMO",
      medicationId: "med-4",
      medicationName: "Atorvastatin",
      dosage: "20mg (1 tablet)",
      scheduledTime: `${today}T21:00:00.000Z`,
      scheduledTimeLocal: "21:00",
      scheduledDate: today,
      status: "scheduled",
      createdAt: now,
      updatedAt: now,
    },
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDateStr = tomorrow.toISOString().split("T")[0];

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekDateStr = nextWeek.toISOString().split("T")[0];

  const appointments: Record<string, Appointment> = {
    "apt-1": {
      id: "apt-1",
      circleId: "CC-DEMO",
      doctor: "Dr. Evelyn Thorne",
      specialty: "Cardiology",
      dateTime: `${tomorrowDateStr}T10:30:00`,
      location: "Heart & Vascular Center, Suite 402, St. Jude Medical Pavilion",
      notes: "Follow-up blood pressure check and lipid panel review. Bring log of morning readings.",
      createdAt: now,
      updatedAt: now,
    },
    "apt-2": {
      id: "apt-2",
      circleId: "CC-DEMO",
      doctor: "Dr. Marcus Vance",
      specialty: "Optometry & Ophthalmology",
      dateTime: `${nextWeekDateStr}T14:15:00`,
      location: "Clarity Vision Clinic, 804 Elm St",
      notes: "Annual diabetic retinal exam. Pupil dilation planned, Sarah will drive.",
      createdAt: now,
      updatedAt: now,
    },
  };

  const activityLogs: Record<string, ActivityLog> = {
    "act-1": {
      id: "act-1",
      circleId: "CC-DEMO",
      memberId: "mem-caretaker",
      memberName: "Sarah Jenkins",
      memberRole: "caretaker",
      action: "CIRCLE_CREATED",
      details: "CareCircle established for Margaret Jenkins",
      timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
      affectsElder: false,
    },
    "act-2": {
      id: "act-2",
      circleId: "CC-DEMO",
      memberId: "mem-caretaker",
      memberName: "Sarah Jenkins",
      memberRole: "caretaker",
      action: "MEDICATION_CREATED",
      details: "Added Metformin (500mg, 2x/day) to prescription plan",
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      affectsElder: true,
    },
    "act-3": {
      id: "act-3",
      circleId: "CC-DEMO",
      memberId: "mem-elder",
      memberName: "Margaret Jenkins",
      memberRole: "elder",
      action: "DOSE_TAKEN",
      details: "Took Amlodipine 5mg on time",
      timestamp: `${today}T08:05:00.000Z`,
      affectsElder: true,
    },
    "act-4": {
      id: "act-4",
      circleId: "CC-DEMO",
      memberId: "mem-elder",
      memberName: "Margaret Jenkins",
      memberRole: "elder",
      action: "DOSE_TAKEN",
      details: "Took Metformin 500mg with breakfast",
      timestamp: `${today}T08:35:00.000Z`,
      affectsElder: true,
    },
  };

  return {
    circles: { "CC-DEMO": circle },
    members,
    medications,
    doseEvents,
    appointments,
    activityLogs,
  };
}

// In-memory store cached on globalThis across serverless function invocations
declare global {
  // eslint-disable-next-line no-var
  var __carecircle_in_memory_store: StoreSchema | undefined;
}

function getStore(): StoreSchema {
  if (!globalThis.__carecircle_in_memory_store) {
    globalThis.__carecircle_in_memory_store = getInitialDemoData();
  }
  return globalThis.__carecircle_in_memory_store;
}

// ==========================================
// 3. Unified Safe Data Access Operations
// ==========================================

// --- Circles ---
export async function getCircle(circleId: string): Promise<Circle | null> {
  const db = initFirestore();
  if (db) {
    try {
      const doc = await db.collection("circles").doc(circleId).get();
      if (doc.exists) return doc.data() as Circle;
    } catch (err) {
      console.warn("[CareCircle DB] Firestore getCircle failed, falling back to in-memory:", err);
    }
  }
  const store = getStore();
  return store.circles[circleId] || null;
}

export async function saveCircle(circle: Circle): Promise<void> {
  const store = getStore();
  store.circles[circle.id] = circle;

  const db = initFirestore();
  if (db) {
    try {
      await db.collection("circles").doc(circle.id).set(circle);
    } catch (err) {
      console.warn("[CareCircle DB] Firestore saveCircle failed, saved in-memory:", err);
    }
  }
}

// --- Members ---
export async function getMembersByCircle(circleId: string): Promise<Member[]> {
  const db = initFirestore();
  if (db) {
    try {
      const snap = await db.collection("members").where("circleId", "==", circleId).get();
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as Member);
      }
    } catch (err) {
      console.warn("[CareCircle DB] Firestore getMembersByCircle failed, falling back to in-memory:", err);
    }
  }
  const store = getStore();
  return Object.values(store.members).filter((m) => m.circleId === circleId);
}

export async function getMemberByCircleAndRole(circleId: string, role: Role): Promise<Member | null> {
  const members = await getMembersByCircle(circleId);
  return members.find((m) => m.role === role) || null;
}

export async function saveMember(member: Member): Promise<void> {
  const store = getStore();
  store.members[member.id] = member;

  const db = initFirestore();
  if (db) {
    try {
      await db.collection("members").doc(member.id).set(member);
    } catch (err) {
      console.warn("[CareCircle DB] Firestore saveMember failed, saved in-memory:", err);
    }
  }
}

// --- Medications ---
export async function getMedications(circleId: string): Promise<Medication[]> {
  const db = initFirestore();
  if (db) {
    try {
      const snap = await db.collection("medications").where("circleId", "==", circleId).get();
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as Medication);
      }
    } catch (err) {
      console.warn("[CareCircle DB] Firestore getMedications failed, falling back to in-memory:", err);
    }
  }
  const store = getStore();
  return Object.values(store.medications).filter((m) => m.circleId === circleId);
}

export async function getMedicationById(id: string): Promise<Medication | null> {
  const db = initFirestore();
  if (db) {
    try {
      const doc = await db.collection("medications").doc(id).get();
      if (doc.exists) return doc.data() as Medication;
    } catch (err) {
      console.warn("[CareCircle DB] Firestore getMedicationById failed, falling back to in-memory:", err);
    }
  }
  const store = getStore();
  return store.medications[id] || null;
}

export async function saveMedication(med: Medication): Promise<void> {
  const store = getStore();
  store.medications[med.id] = med;

  const db = initFirestore();
  if (db) {
    try {
      await db.collection("medications").doc(med.id).set(med);
    } catch (err) {
      console.warn("[CareCircle DB] Firestore saveMedication failed, saved in-memory:", err);
    }
  }
}

export async function deleteMedication(id: string): Promise<void> {
  const store = getStore();
  delete store.medications[id];

  const db = initFirestore();
  if (db) {
    try {
      await db.collection("medications").doc(id).delete();
    } catch (err) {
      console.warn("[CareCircle DB] Firestore deleteMedication failed, deleted in-memory:", err);
    }
  }
}

// --- Dose Events ---
export async function getDoseEvents(circleId: string, dateStr?: string): Promise<DoseEvent[]> {
  const db = initFirestore();
  if (db) {
    try {
      let q = db.collection("dose_events").where("circleId", "==", circleId);
      if (dateStr) {
        q = q.where("scheduledDate", "==", dateStr);
      }
      const snap = await q.get();
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as DoseEvent);
      }
    } catch (err) {
      console.warn("[CareCircle DB] Firestore getDoseEvents failed, falling back to in-memory:", err);
    }
  }
  const store = getStore();
  return Object.values(store.doseEvents).filter(
    (e) => e.circleId === circleId && (!dateStr || e.scheduledDate === dateStr)
  );
}

export async function getAllDoseEvents(circleId: string): Promise<DoseEvent[]> {
  const db = initFirestore();
  if (db) {
    try {
      const snap = await db.collection("dose_events").where("circleId", "==", circleId).get();
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as DoseEvent);
      }
    } catch (err) {
      console.warn("[CareCircle DB] Firestore getAllDoseEvents failed, falling back to in-memory:", err);
    }
  }
  const store = getStore();
  return Object.values(store.doseEvents).filter((e) => e.circleId === circleId);
}

export async function saveDoseEvent(event: DoseEvent): Promise<void> {
  const store = getStore();
  store.doseEvents[event.id] = event;

  const db = initFirestore();
  if (db) {
    try {
      await db.collection("dose_events").doc(event.id).set(event);
    } catch (err) {
      console.warn("[CareCircle DB] Firestore saveDoseEvent failed, saved in-memory:", err);
    }
  }
}

export async function updateDoseEvent(id: string, updates: Partial<DoseEvent>): Promise<DoseEvent | null> {
  const store = getStore();
  if (store.doseEvents[id]) {
    store.doseEvents[id] = {
      ...store.doseEvents[id],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  }

  const db = initFirestore();
  if (db) {
    try {
      const ref = db.collection("dose_events").doc(id);
      await ref.update({ ...updates, updatedAt: new Date().toISOString() });
      const updated = await ref.get();
      if (updated.exists) return updated.data() as DoseEvent;
    } catch (err) {
      console.warn("[CareCircle DB] Firestore updateDoseEvent failed, updated in-memory:", err);
    }
  }

  return store.doseEvents[id] || null;
}

// --- Appointments ---
export async function getAppointments(circleId: string): Promise<Appointment[]> {
  const db = initFirestore();
  if (db) {
    try {
      const snap = await db.collection("appointments").where("circleId", "==", circleId).get();
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as Appointment);
      }
    } catch (err) {
      console.warn("[CareCircle DB] Firestore getAppointments failed, falling back to in-memory:", err);
    }
  }
  const store = getStore();
  return Object.values(store.appointments).filter((a) => a.circleId === circleId);
}

export async function saveAppointment(apt: Appointment): Promise<void> {
  const store = getStore();
  store.appointments[apt.id] = apt;

  const db = initFirestore();
  if (db) {
    try {
      await db.collection("appointments").doc(apt.id).set(apt);
    } catch (err) {
      console.warn("[CareCircle DB] Firestore saveAppointment failed, saved in-memory:", err);
    }
  }
}

export async function deleteAppointment(id: string): Promise<void> {
  const store = getStore();
  delete store.appointments[id];

  const db = initFirestore();
  if (db) {
    try {
      await db.collection("appointments").doc(id).delete();
    } catch (err) {
      console.warn("[CareCircle DB] Firestore deleteAppointment failed, deleted in-memory:", err);
    }
  }
}

// --- Activity Logs ---
export async function logActivity(log: Omit<ActivityLog, "id" | "timestamp">): Promise<ActivityLog> {
  const fullLog: ActivityLog = {
    ...log,
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  const store = getStore();
  store.activityLogs[fullLog.id] = fullLog;

  const db = initFirestore();
  if (db) {
    try {
      await db.collection("activity_logs").doc(fullLog.id).set(fullLog);
    } catch (err) {
      console.warn("[CareCircle DB] Firestore logActivity failed, logged in-memory:", err);
    }
  }

  return fullLog;
}

export async function getActivityLogs(circleId: string, limitCount = 50): Promise<ActivityLog[]> {
  const db = initFirestore();
  if (db) {
    try {
      const snap = await db
        .collection("activity_logs")
        .where("circleId", "==", circleId)
        .orderBy("timestamp", "desc")
        .limit(limitCount)
        .get();
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as ActivityLog);
      }
    } catch (err) {
      console.warn("[CareCircle DB] Firestore getActivityLogs failed, falling back to in-memory:", err);
    }
  }
  const store = getStore();
  return Object.values(store.activityLogs)
    .filter((a) => a.circleId === circleId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limitCount);
}

// Helper to check DB status
export function getDbStatus(): { mode: "firestore" | "in_memory"; projectId?: string } {
  return {
    mode: useFirebase ? "firestore" : "in_memory",
    projectId: process.env.FIREBASE_PROJECT_ID,
  };
}
