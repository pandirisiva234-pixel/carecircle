import { describe, it, expect } from "vitest";
import {
  todayInTz,
  getTzOffsetMinutes,
  zonedTimeToUtcIso,
  addDays,
  weekdayLabel,
  parseDateTimeInTz,
} from "../lib/timezone";
import { buildDoseEventsForDay, compute7DayTrend, evaluateDoseEscalation } from "../lib/adherence";
import { Medication, DoseEvent } from "../lib/types";

describe("Timezone helpers", () => {
  it("returns the local calendar day in Asia/Kolkata, not the UTC day", () => {
    // 20:00 UTC on Nov 15 is already 01:30 on Nov 16 in India
    const instant = new Date("2026-11-15T20:00:00.000Z");
    expect(todayInTz(instant, "Asia/Kolkata")).toBe("2026-11-16");
    expect(todayInTz(instant, "UTC")).toBe("2026-11-15");
  });

  it("knows India is UTC+05:30", () => {
    expect(getTzOffsetMinutes(new Date("2026-11-15T00:00:00Z"), "Asia/Kolkata")).toBe(330);
  });

  it("converts an 8:00 AM IST dose to 02:30 UTC", () => {
    expect(zonedTimeToUtcIso("2026-11-15", "08:00", "Asia/Kolkata")).toBe("2026-11-15T02:30:00.000Z");
  });

  it("handles daylight saving zones (New York, summer vs winter)", () => {
    expect(zonedTimeToUtcIso("2026-07-01", "08:00", "America/New_York")).toBe("2026-07-01T12:00:00.000Z");
    expect(zonedTimeToUtcIso("2026-12-01", "08:00", "America/New_York")).toBe("2026-12-01T13:00:00.000Z");
  });

  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("labels weekdays from date strings", () => {
    expect(weekdayLabel("2026-11-15")).toBe("Sun");
  });

  it("parses appointment times without an offset in the circle's timezone", () => {
    expect(parseDateTimeInTz("2026-11-16T10:30", "Asia/Kolkata").toISOString()).toBe("2026-11-16T05:00:00.000Z");
    expect(parseDateTimeInTz("2026-11-16T05:00:00.000Z").toISOString()).toBe("2026-11-16T05:00:00.000Z");
  });
});

describe("Timezone-correct scheduling", () => {
  const med: Medication = {
    id: "med-bp",
    circleId: "CC-TZ",
    name: "Amlodipine",
    dosage: "5mg",
    timesPerDay: 1,
    scheduleTimes: ["08:00"],
    startDate: "2026-11-01",
    notes: "",
    active: true,
    createdAt: "2026-11-01T00:00:00Z",
    updatedAt: "2026-11-01T00:00:00Z",
  };

  it("schedules doses at the elder's local wall-clock time", () => {
    const [dose] = buildDoseEventsForDay([med], [], "2026-11-15", "CC-TZ", "Asia/Kolkata");
    expect(dose.scheduledTimeLocal).toBe("08:00");
    expect(dose.scheduledTime).toBe("2026-11-15T02:30:00.000Z");
  });

  it("uses deterministic dose ids so repeated reconciliation never duplicates doses", () => {
    const first = buildDoseEventsForDay([med], [], "2026-11-15", "CC-TZ");
    const second = buildDoseEventsForDay([med], [], "2026-11-15", "CC-TZ");
    expect(first[0].id).toBe(second[0].id);
  });

  it("escalates a missed 8:00 AM IST dose only after 08:30 IST", () => {
    const [dose] = buildDoseEventsForDay([med], [], "2026-11-15", "CC-TZ", "Asia/Kolkata");
    const at0815Ist = new Date("2026-11-15T02:45:00.000Z");
    const at0845Ist = new Date("2026-11-15T03:15:00.000Z");
    expect(evaluateDoseEscalation([dose], at0815Ist).elderReminders).toHaveLength(1);
    expect(evaluateDoseEscalation([dose], at0815Ist).escalatedReminders).toHaveLength(0);
    expect(evaluateDoseEscalation([dose], at0845Ist).escalatedReminders).toHaveLength(1);
  });

  it("builds the 7-day trend on IST calendar days", () => {
    const events: DoseEvent[] = [
      {
        id: "d1",
        circleId: "CC-TZ",
        medicationId: "med-bp",
        medicationName: "Amlodipine",
        dosage: "5mg",
        scheduledTime: "2026-11-15T20:00:00.000Z",
        scheduledTimeLocal: "01:30",
        scheduledDate: "2026-11-16",
        status: "taken",
        createdAt: "",
        updatedAt: "",
      },
    ];
    const trend = compute7DayTrend(events, new Date("2026-11-15T20:00:00.000Z"), "Asia/Kolkata");
    expect(trend).toHaveLength(7);
    expect(trend[6].date).toBe("2026-11-16");
    expect(trend[6].taken).toBe(1);
  });
});
