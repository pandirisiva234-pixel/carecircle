import { NextResponse } from "next/server";
import { getDbStatus } from "@/lib/db";
import { DEFAULT_TIMEZONE, todayInTz } from "@/lib/timezone";
import { isEmailConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";

/** GET /api/health — lightweight status check for uptime monitors and reviewers. No secrets exposed. */
export async function GET() {
  const db = getDbStatus();
  return NextResponse.json({
    status: "ok",
    service: "carecircle",
    database: db.mode,
    timezone: DEFAULT_TIMEZONE,
    today: todayInTz(),
    gemini: Boolean(process.env.GEMINI_API_KEY),
    email: isEmailConfigured() ? "gmail" : "simulated",
    timestamp: new Date().toISOString(),
  });
}
