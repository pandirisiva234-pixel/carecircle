import { describe, it, expect } from "vitest";
import { medicationSchema, appointmentSchema, loginSchema, doseUpdateSchema, joinCircleSchema } from "../lib/validations";

describe("Medication validation", () => {
  const valid = {
    name: "Amlodipine",
    dosage: "5mg",
    timesPerDay: 1,
    scheduleTimes: ["08:00"],
    startDate: "2026-11-15",
  };

  it("accepts a valid medication and applies defaults", () => {
    const parsed = medicationSchema.parse(valid);
    expect(parsed.active).toBe(true);
    expect(parsed.notes).toBe("");
  });

  it("rejects invalid times like 25:00 or 8am", () => {
    expect(medicationSchema.safeParse({ ...valid, scheduleTimes: ["25:00"] }).success).toBe(false);
    expect(medicationSchema.safeParse({ ...valid, scheduleTimes: ["8am"] }).success).toBe(false);
  });

  it("rejects an empty schedule and too many daily doses", () => {
    expect(medicationSchema.safeParse({ ...valid, scheduleTimes: [] }).success).toBe(false);
    expect(medicationSchema.safeParse({ ...valid, timesPerDay: 7 }).success).toBe(false);
  });

  it("rejects badly formatted dates", () => {
    expect(medicationSchema.safeParse({ ...valid, startDate: "15/11/2026" }).success).toBe(false);
  });

  it("caps free-text length to prevent abuse", () => {
    expect(medicationSchema.safeParse({ ...valid, notes: "x".repeat(501) }).success).toBe(false);
  });
});

describe("Auth & dose validation", () => {
  it("normalises circle IDs to upper case on login", () => {
    const parsed = loginSchema.parse({ circleId: "cc-demo", role: "elder", passcode: "1234" });
    expect(parsed.circleId).toBe("CC-DEMO");
  });

  it("rejects unknown roles and short passcodes", () => {
    expect(loginSchema.safeParse({ circleId: "CC-DEMO", role: "admin", passcode: "1234" }).success).toBe(false);
    expect(loginSchema.safeParse({ circleId: "CC-DEMO", role: "elder", passcode: "12" }).success).toBe(false);
  });

  it("requires a valid email to join a circle (for reminders)", () => {
    expect(
      joinCircleSchema.safeParse({ circleId: "CC-DEMO", memberName: "Ravi", role: "family", passcode: "4321", email: "nope" })
        .success
    ).toBe(false);
  });

  it("only allows known dose statuses", () => {
    expect(doseUpdateSchema.safeParse({ doseEventId: "d1", status: "taken" }).success).toBe(true);
    expect(doseUpdateSchema.safeParse({ doseEventId: "d1", status: "deleted" }).success).toBe(false);
  });

  it("validates appointments", () => {
    expect(
      appointmentSchema.safeParse({ doctor: "Dr. Rao", specialty: "Cardiology", dateTime: "2026-11-16T10:30", location: "Apollo" })
        .success
    ).toBe(true);
    expect(appointmentSchema.safeParse({ doctor: "D", specialty: "", dateTime: "x", location: "" }).success).toBe(false);
  });
});
