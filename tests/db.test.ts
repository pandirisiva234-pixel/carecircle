import { describe, it, expect, beforeAll } from "vitest";

// No Firebase credentials in tests: the data layer runs on its in-memory store
beforeAll(() => {
  delete process.env.FIREBASE_PROJECT_ID;
  delete process.env.FIREBASE_CLIENT_EMAIL;
  delete process.env.FIREBASE_PRIVATE_KEY;
});

describe("Data layer (in-memory mode)", () => {
  it("seeds the judge demo circle with members, medicines and a week of history", async () => {
    const { getCircle, getMembersByCircle, getMedications, getAllDoseEvents } = await import("../lib/db");
    expect((await getCircle("CC-DEMO"))?.elderName).toBe("Margaret Jenkins");
    expect((await getMembersByCircle("CC-DEMO")).map((m) => m.role).sort()).toEqual(["caretaker", "elder", "family"]);
    expect((await getMedications("CC-DEMO")).length).toBeGreaterThanOrEqual(4);
    const days = new Set((await getAllDoseEvents("CC-DEMO")).map((d) => d.scheduledDate));
    expect(days.size).toBe(7);
  });

  it("never stores passcodes in plain text", async () => {
    const { getMembersByCircle } = await import("../lib/db");
    for (const m of await getMembersByCircle("CC-DEMO")) {
      expect(m.passcodeHash).not.toMatch(/^\d{4}$/);
      expect(m.passcodeHash.startsWith("$2")).toBe(true);
    }
  });

  it("batch-saves dose events and reads one back by id", async () => {
    const { saveDoseEvents, getDoseEventById } = await import("../lib/db");
    const now = new Date().toISOString();
    await saveDoseEvents([
      {
        id: "dose-test-1",
        circleId: "CC-TEST",
        medicationId: "m1",
        medicationName: "Test",
        dosage: "1 tab",
        scheduledTime: now,
        scheduledTimeLocal: "08:00",
        scheduledDate: "2026-11-15",
        status: "scheduled",
        createdAt: now,
        updatedAt: now,
      },
    ]);
    expect((await getDoseEventById("dose-test-1"))?.circleId).toBe("CC-TEST");
    expect(await getDoseEventById("does-not-exist")).toBeNull();
  });

  it("keeps circles isolated from each other", async () => {
    const { getAllDoseEvents } = await import("../lib/db");
    const demo = await getAllDoseEvents("CC-DEMO");
    expect(demo.some((d) => d.id === "dose-test-1")).toBe(false);
  });
});
