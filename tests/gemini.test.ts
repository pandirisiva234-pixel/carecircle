import { describe, it, expect } from "vitest";
import { friendlyGeminiError, GEMINI_MODELS } from "../lib/gemini";

import { sampleprescriptionResult } from "../lib/gemini";

describe("Built-in sample prescription result", () => {
  it("matches the 1-0-1 notation on the sample (morning / night times)", () => {
    const meds = sampleprescriptionResult();
    expect(meds.map((m) => m.name)).toEqual(["Amlodipine", "Metformin", "Pantoprazole", "Atorvastatin"]);
    expect(meds.find((m) => m.name === "Metformin")?.scheduleTimes).toEqual(["08:00", "21:00"]);
    expect(meds.every((m) => m.timesPerDay === m.scheduleTimes.length)).toBe(true);
  });
});

describe("Gemini integration safeguards", () => {
  it("has a current default model and a fallback model", () => {
    expect(GEMINI_MODELS[0]).toBe(process.env.GEMINI_MODEL || "gemini-3.8-flash");
    expect(GEMINI_MODELS.length).toBeGreaterThanOrEqual(2);
    expect(GEMINI_MODELS).not.toContain("gemini-2.5-flash");
  });

  it("never shows raw API JSON to caretakers", () => {
    const raw = '{"error":{"code":404,"message":"This model models/x is no longer available","status":"NOT_FOUND"}}';
    const msg = friendlyGeminiError(raw);
    expect(msg).not.toContain("{");
    expect(msg).toMatch(/model/i);
  });

  it("explains key, quota and unreadable-image problems in plain language", () => {
    expect(friendlyGeminiError("API key not valid")).toMatch(/API key/);
    expect(friendlyGeminiError("RESOURCE_EXHAUSTED: quota exceeded")).toMatch(/try again/i);
    expect(friendlyGeminiError("Unexpected token < in JSON")).toMatch(/photo/i);
    expect(
      friendlyGeminiError('{"error":{"code":503,"message":"This model is currently experiencing high demand.","status":"UNAVAILABLE"}}')
    ).toMatch(/busy/i);
  });
});
