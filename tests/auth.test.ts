import { describe, it, expect, beforeEach, vi } from "vitest";
import { signToken, verifyToken, hashPasscode, verifyPasscode, checkRateLimit } from "../lib/auth";
import { SessionUser } from "../lib/types";

const user: SessionUser = {
  memberId: "mem-caretaker",
  name: "Sarah Jenkins",
  role: "caretaker",
  circleId: "CC-DEMO",
  circleName: "Jenkins Family Circle",
  elderName: "Margaret Jenkins",
  email: "sarah.demo@carecircle.app",
};

describe("Signed session tokens", () => {
  it("round-trips a valid session", () => {
    const token = signToken(user);
    expect(verifyToken(token)).toEqual(user);
  });

  it("rejects a token whose payload was tampered with (role escalation attempt)", () => {
    const [payload, signature] = signToken(user).split(".");
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    decoded.user.role = "elder";
    decoded.user.circleId = "CC-OTHER";
    const forged = `${Buffer.from(JSON.stringify(decoded)).toString("base64url")}.${signature}`;
    expect(verifyToken(forged)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifyToken("")).toBeNull();
    expect(verifyToken("not-a-token")).toBeNull();
    expect(verifyToken("a.b.c")).toBeNull();
  });

  it("rejects expired tokens", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-15T00:00:00Z"));
    const token = signToken(user);
    vi.setSystemTime(new Date("2026-11-23T00:00:00Z")); // 8 days later, sessions last 7
    expect(verifyToken(token)).toBeNull();
    vi.useRealTimers();
  });
});

describe("Passcode hashing", () => {
  it("never stores the passcode in plain text and verifies correctly", async () => {
    const hash = await hashPasscode("5678");
    expect(hash).not.toContain("5678");
    expect(await verifyPasscode("5678", hash)).toBe(true);
    expect(await verifyPasscode("0000", hash)).toBe(false);
  });

  it("fails safely on a corrupt hash", async () => {
    expect(await verifyPasscode("1234", "not-a-bcrypt-hash")).toBe(false);
  });
});

describe("Login rate limiting", () => {
  let key: string;
  beforeEach(() => {
    key = `test-${Math.random()}`;
  });

  it("allows up to the limit and then blocks", () => {
    for (let i = 0; i < 5; i++) expect(checkRateLimit(key, 5).allowed).toBe(true);
    const blocked = checkRateLimit(key, 5);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("resets after the window expires", () => {
    vi.useFakeTimers();
    for (let i = 0; i < 5; i++) checkRateLimit(key, 5, 1000);
    expect(checkRateLimit(key, 5, 1000).allowed).toBe(false);
    vi.advanceTimersByTime(1500);
    expect(checkRateLimit(key, 5, 1000).allowed).toBe(true);
    vi.useRealTimers();
  });
});
