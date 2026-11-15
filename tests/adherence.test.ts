import { describe, it, expect } from "vitest";
import {
  buildDoseEventsForDay,
  calculateAdherenceMetrics,
  compute7DayTrend,
  evaluateDoseEscalation,
} from "../lib/adherence";
import { Medication, DoseEvent } from "../lib/types";

describe("Scheduling Logic (buildDoseEventsForDay)", () => {
  const sampleMeds: Medication[] = [
    {
      id: "med-bp",
      circleId: "CC-TEST",
      name: "Amlodipine",
      dosage: "5mg",
      timesPerDay: 1,
      scheduleTimes: ["08:00"],
      startDate: "2026-11-01",
      notes: "Morning BP",
      active: true,
      createdAt: "2026-11-01T00:00:00Z",
      updatedAt: "2026-11-01T00:00:00Z",
    },
    {
      id: "med-sugar",
      circleId: "CC-TEST",
      name: "Metformin",
      dosage: "500mg",
      timesPerDay: 2,
      scheduleTimes: ["08:30", "20:00"],
      startDate: "2026-11-01",
      endDate: "2026-11-20",
      notes: "Meals",
      active: true,
      createdAt: "2026-11-01T00:00:00Z",
      updatedAt: "2026-11-01T00:00:00Z",
    },
    {
      id: "med-inactive",
      circleId: "CC-TEST",
      name: "Old Med",
      dosage: "10mg",
      timesPerDay: 1,
      scheduleTimes: ["12:00"],
      startDate: "2026-11-01",
      notes: "Discontinued",
      active: false,
      createdAt: "2026-11-01T00:00:00Z",
      updatedAt: "2026-11-01T00:00:00Z",
    },
  ];

  it("generates dose events for active medications within date range", () => {
    const events = buildDoseEventsForDay(sampleMeds, [], "2026-11-15", "CC-TEST");

    // 1 from Amlodipine + 2 from Metformin = 3 total doses. Inactive ignored.
    expect(events.length).toBe(3);
    expect(events[0].medicationName).toBe("Amlodipine");
    expect(events[0].scheduledTimeLocal).toBe("08:00");
    expect(events[1].medicationName).toBe("Metformin");
    expect(events[1].scheduledTimeLocal).toBe("08:30");
    expect(events[2].medicationName).toBe("Metformin");
    expect(events[2].scheduledTimeLocal).toBe("20:00");
    expect(events.every((e) => e.status === "scheduled")).toBe(true);
  });

  it("does not generate events after medication endDate has passed", () => {
    const events = buildDoseEventsForDay(sampleMeds, [], "2026-11-25", "CC-TEST");
    // Metformin ended on 2026-11-20, so only Amlodipine should be scheduled
    expect(events.length).toBe(1);
    expect(events[0].medicationName).toBe("Amlodipine");
  });

  it("preserves status of already taken doses for the day", () => {
    const existingTaken: DoseEvent = {
      id: "existing-1",
      circleId: "CC-TEST",
      medicationId: "med-bp",
      medicationName: "Amlodipine",
      dosage: "5mg",
      scheduledTime: "2026-11-15T08:00:00.000Z",
      scheduledTimeLocal: "08:00",
      scheduledDate: "2026-11-15",
      status: "taken",
      takenAt: "2026-11-15T08:04:00.000Z",
      createdAt: "2026-11-15T08:00:00Z",
      updatedAt: "2026-11-15T08:04:00Z",
    };

    const events = buildDoseEventsForDay(sampleMeds, [existingTaken], "2026-11-15", "CC-TEST");
    const bpDose = events.find((e) => e.medicationId === "med-bp");
    expect(bpDose).toBeDefined();
    expect(bpDose?.status).toBe("taken");
    expect(bpDose?.id).toBe("existing-1");
  });
});

describe("Adherence Calculation (calculateAdherenceMetrics & compute7DayTrend)", () => {
  it("computes 100% adherence when all doses are taken", () => {
    const events: DoseEvent[] = [
      {
        id: "1",
        circleId: "c1",
        medicationId: "m1",
        medicationName: "Med 1",
        dosage: "10mg",
        scheduledTime: "2026-11-15T08:00:00Z",
        scheduledTimeLocal: "08:00",
        scheduledDate: "2026-11-15",
        status: "taken",
        createdAt: "2026-11-15T08:00:00Z",
        updatedAt: "2026-11-15T08:00:00Z",
      },
      {
        id: "2",
        circleId: "c1",
        medicationId: "m2",
        medicationName: "Med 2",
        dosage: "20mg",
        scheduledTime: "2026-11-15T12:00:00Z",
        scheduledTimeLocal: "12:00",
        scheduledDate: "2026-11-15",
        status: "taken",
        createdAt: "2026-11-15T12:00:00Z",
        updatedAt: "2026-11-15T12:00:00Z",
      },
    ];

    const metrics = calculateAdherenceMetrics(events);
    expect(metrics.totalDoses).toBe(2);
    expect(metrics.takenDoses).toBe(2);
    expect(metrics.missedDoses).toBe(0);
    expect(metrics.overallRate).toBe(100);
  });

  it("calculates accurate percentage when doses are missed", () => {
    const events: DoseEvent[] = [
      {
        id: "1",
        circleId: "c1",
        medicationId: "m1",
        medicationName: "Med 1",
        dosage: "10mg",
        scheduledTime: "2026-11-15T08:00:00Z",
        scheduledTimeLocal: "08:00",
        scheduledDate: "2026-11-15",
        status: "taken",
        createdAt: "2026-11-15T08:00:00Z",
        updatedAt: "2026-11-15T08:00:00Z",
      },
      {
        id: "2",
        circleId: "c1",
        medicationId: "m2",
        medicationName: "Med 2",
        dosage: "20mg",
        scheduledTime: "2026-11-15T12:00:00Z",
        scheduledTimeLocal: "12:00",
        scheduledDate: "2026-11-15",
        status: "missed",
        createdAt: "2026-11-15T12:00:00Z",
        updatedAt: "2026-11-15T12:00:00Z",
      },
      {
        id: "3",
        circleId: "c1",
        medicationId: "m3",
        medicationName: "Med 3",
        dosage: "5mg",
        scheduledTime: "2026-11-15T20:00:00Z",
        scheduledTimeLocal: "20:00",
        scheduledDate: "2026-11-15",
        status: "scheduled", // pending later tonight
        createdAt: "2026-11-15T08:00:00Z",
        updatedAt: "2026-11-15T08:00:00Z",
      },
    ];

    const metrics = calculateAdherenceMetrics(events);
    expect(metrics.totalDoses).toBe(3);
    expect(metrics.takenDoses).toBe(1);
    expect(metrics.missedDoses).toBe(1);
    expect(metrics.pendingDoses).toBe(1);
    // 1 taken out of 2 completed slots = 50%
    expect(metrics.overallRate).toBe(50);
  });

  it("generates a 7-day trend array", () => {
    const trend = compute7DayTrend([], new Date("2026-11-15T12:00:00Z"));
    expect(trend.length).toBe(7);
    expect(trend[6].date).toBe("2026-11-15");
  });
});

describe("Escalation Logic (evaluateDoseEscalation)", () => {
  it("alerts elder for newly overdue dose (< 30 minutes)", () => {
    // Scheduled at 08:00, current time 08:15 (15 min overdue)
    const testEvents: DoseEvent[] = [
      {
        id: "dose-15min-late",
        circleId: "c1",
        medicationId: "m1",
        medicationName: "Lisinopril",
        dosage: "10mg",
        scheduledTime: "2026-11-15T08:00:00.000Z",
        scheduledTimeLocal: "08:00",
        scheduledDate: "2026-11-15",
        status: "scheduled",
        missedReminderElderSent: false,
        createdAt: "2026-11-15T08:00:00Z",
        updatedAt: "2026-11-15T08:00:00Z",
      },
    ];

    const result = evaluateDoseEscalation(testEvents, new Date("2026-11-15T08:15:00.000Z"));

    expect(result.elderReminders.length).toBe(1);
    expect(result.elderReminders[0].id).toBe("dose-15min-late");
    expect(result.escalatedReminders.length).toBe(0);
    expect(result.markedMissed.length).toBe(0);
  });

  it("escalates to family/caretakers when overdue >= 30 minutes and marks missed", () => {
    // Scheduled at 08:00, current time 08:35 (35 min overdue)
    const testEvents: DoseEvent[] = [
      {
        id: "dose-35min-late",
        circleId: "c1",
        medicationId: "m1",
        medicationName: "Metformin",
        dosage: "500mg",
        scheduledTime: "2026-11-15T08:00:00.000Z",
        scheduledTimeLocal: "08:00",
        scheduledDate: "2026-11-15",
        status: "scheduled",
        missedReminderElderSent: true,
        missedReminderEscalatedSent: false,
        createdAt: "2026-11-15T08:00:00Z",
        updatedAt: "2026-11-15T08:00:00Z",
      },
    ];

    const result = evaluateDoseEscalation(testEvents, new Date("2026-11-15T08:35:00.000Z"));

    expect(result.escalatedReminders.length).toBe(1);
    expect(result.escalatedReminders[0].id).toBe("dose-35min-late");
    expect(result.markedMissed.length).toBe(1);
    expect(result.markedMissed[0].status).toBe("missed");
  });

  it("does not escalate or alert for doses already marked taken", () => {
    const testEvents: DoseEvent[] = [
      {
        id: "dose-taken",
        circleId: "c1",
        medicationId: "m1",
        medicationName: "Atorvastatin",
        dosage: "20mg",
        scheduledTime: "2026-11-15T08:00:00.000Z",
        scheduledTimeLocal: "08:00",
        scheduledDate: "2026-11-15",
        status: "taken",
        takenAt: "2026-11-15T08:02:00.000Z",
        createdAt: "2026-11-15T08:00:00Z",
        updatedAt: "2026-11-15T08:02:00Z",
      },
    ];

    const result = evaluateDoseEscalation(testEvents, new Date("2026-11-15T09:00:00.000Z"));
    expect(result.elderReminders.length).toBe(0);
    expect(result.escalatedReminders.length).toBe(0);
    expect(result.markedMissed.length).toBe(0);
  });
});
