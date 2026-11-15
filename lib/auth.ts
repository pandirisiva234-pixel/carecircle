import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SessionUser } from "./types";

const COOKIE_NAME = "carecircle_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "carecircle-fallback-secret-key-32-chars-long";
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

// --- Passcode Hashing ---
export async function hashPasscode(passcode: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(passcode, salt);
}

export async function verifyPasscode(passcode: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(passcode, hash);
  } catch {
    return false;
  }
}

// --- Signed Session Token (HMAC-SHA256) ---
interface SessionPayload {
  user: SessionUser;
  exp: number;
}

export function signToken(user: SessionUser): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const payload: SessionPayload = { user, exp };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [encodedPayload, signature] = parts;
    
    const expectedSig = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(encodedPayload)
      .digest("base64url");

    // Timing-safe comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const json = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const payload: SessionPayload = JSON.parse(json);

    if (Date.now() / 1000 > payload.exp) {
      return null; // Expired
    }

    return payload.user;
  } catch {
    return null;
  }
}

// --- Next.js Cookie Helpers ---
export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = signToken(user);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// --- Rate Limiting (In-Memory Sliding Window) ---
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export function checkRateLimit(key: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
} {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, resetInSeconds: Math.ceil(windowMs / 1000) };
  }

  if (entry.count >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.max(0, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: maxAttempts - entry.count,
    resetInSeconds: Math.ceil((entry.resetAt - now) / 1000),
  };
}

export function resetRateLimit(key: string): void {
  rateLimitMap.delete(key);
}
