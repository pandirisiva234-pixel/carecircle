import { DoseEvent, Medication, DoseStatus } from "./types";

export interface DayAdherence {
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "Mon", "Tue"
  total: number;
  taken: number;
  missed: number;
  rate: number; // 0 to 100
}

export interface AdherenceSummary {
  totalDoses: number;
  takenDoses: number;
  missedDoses: number;
  pendingDoses: number;
  overallRate: number; // 0 to 100
  weeklyTrend: DayAdherence[];
}

/**
 * Creates or reconciles dose events for a given day and list of medications
 */
export function buildDoseEventsForDay(
  medications: Medication[],
  existingEvents: DoseEvent[],
  dateStr: string, // YYYY-MM-DD
  circleId: string
): DoseEvent[] {
  const existingMap = new Map<string, DoseEvent>();
  for (const ev of existingEvents) {
    if (ev.scheduledDate === dateStr) {
      existingMap.set(`${ev.medicationId}_${ev.scheduledTimeLocal}`, ev);
    }
  }

  const generated: DoseEvent[] = [];
  const now = new Date().toISOString();

  for (const med of medications) {
    if (!med.active) continue;

    // Check date bounds
    if (med.startDate && dateStr < med.startDate) continue;
    if (med.endDate && dateStr > med.endDate) continue;

    for (const timeLocal of med.scheduleTimes) {
      const key = `${med.id}_${timeLocal}`;
      const existing = existingMap.get(key);

      if (existing) {
        generated.push(existing);
      } else {
        const scheduledTimeIso = `${dateStr}T${timeLocal}:00.000Z`;
        const newEvent: DoseEvent = {
          id: `dose-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          circleId,
          medicationId: med.id,
          medicationName: med.name,
          dosage: med.dosage,
          scheduledTime: scheduledTimeIso,
          scheduledTimeLocal: timeLocal,
          scheduledDate: dateStr,
          status: "scheduled",
          createdAt: now,
          updatedAt: now,
        };
        generated.push(newEvent);
      }
    }
  }

  // Sort by scheduled time
  return generated.sort((a, b) => a.scheduledTimeLocal.localeCompare(b.scheduledTimeLocal));
}

/**
 * Computes adherence metrics from a list of dose events
 */
export function calculateAdherenceMetrics(events: DoseEvent[]): AdherenceSummary {
  const totalDoses = events.length;
  let takenDoses = 0;
  let missedDoses = 0;
  let pendingDoses = 0;

  for (const ev of events) {
    if (ev.status === "taken") {
      takenDoses++;
    } else if (ev.status === "missed") {
      missedDoses++;
    } else {
      pendingDoses++;
    }
  }

  // Completed slots considered for rate = taken + missed
  const completedOrMissed = takenDoses + missedDoses;
  const overallRate = completedOrMissed > 0 ? Math.round((takenDoses / completedOrMissed) * 100) : 100;

  // Build 7-day trend
  const weeklyTrend = compute7DayTrend(events);

  return {
    totalDoses,
    takenDoses,
    missedDoses,
    pendingDoses,
    overallRate,
    weeklyTrend,
  };
}

/**
 * Computes day-by-day metrics for the last 7 calendar days
 */
export function compute7DayTrend(events: DoseEvent[], baseDate = new Date()): DayAdherence[] {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const trend: DayAdherence[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayLabel = dayNames[d.getDay()];

    const daysEvents = events.filter((e) => e.scheduledDate === dateStr);
    const total = daysEvents.length;
    const taken = daysEvents.filter((e) => e.status === "taken").length;
    const missed = daysEvents.filter((e) => e.status === "missed").length;

    const denominator = taken + missed;
    const rate = denominator > 0 ? Math.round((taken / denominator) * 100) : total > 0 && taken === total ? 100 : 100;

    trend.push({
      date: dateStr,
      dayLabel,
      total,
      taken,
      missed,
      rate,
    });
  }

  return trend;
}

/**
 * Escalation logic:
 * Checks for dose events that are scheduled, overdue by threshold minutes.
 * - If overdue >= 0 min and < 30 min -> triggers elder reminder
 * - If overdue >= 30 min -> triggers family/caretaker escalation
 */
export interface DoseEscalationCheckResult {
  elderReminders: DoseEvent[];
  escalatedReminders: DoseEvent[];
  markedMissed: DoseEvent[];
}

export function evaluateDoseEscalation(
  events: DoseEvent[],
  currentTime = new Date()
): DoseEscalationCheckResult {
  const elderReminders: DoseEvent[] = [];
  const escalatedReminders: DoseEvent[] = [];
  const markedMissed: DoseEvent[] = [];

  const currentMs = currentTime.getTime();

  for (const ev of events) {
    if (ev.status === "taken") continue;

    // Parse scheduled ISO time or construct from scheduledDate and scheduledTimeLocal
    const schedDate = new Date(ev.scheduledTime);
    const scheduledMs = isNaN(schedDate.getTime())
      ? new Date(`${ev.scheduledDate}T${ev.scheduledTimeLocal}:00`).getTime()
      : schedDate.getTime();

    const diffMinutes = Math.floor((currentMs - scheduledMs) / (1000 * 60));

    // Case 1: Overdue by 30 minutes or more
    if (diffMinutes >= 30) {
      if (!ev.missedReminderEscalatedSent) {
        escalatedReminders.push(ev);
      }
      if (ev.status === "scheduled") {
        markedMissed.push({ ...ev, status: "missed" });
      }
    }
    // Case 2: Overdue by 0 to 29 minutes (Elder immediate alert)
    else if (diffMinutes >= 0 && diffMinutes < 30) {
      if (!ev.missedReminderElderSent) {
        elderReminders.push(ev);
      }
    }
  }

  return {
    elderReminders,
    escalatedReminders,
    markedMissed,
  };
}
