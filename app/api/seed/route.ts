import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { ensureDemoSeeded } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/seed — (re)seeds the judge demo circle CC-DEMO in Firestore.
 * Protected by the same CRON_SECRET header used by the reminders scheduler.
 */
export async function POST(req: NextRequest) {
  const expected = process.env.CRON_SECRET?.trim().replace(/^"|"$/g, "");
  const provided = req.headers.get("x-cron-secret");
  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRET is not configured on the server." }, { status: 503 });
  }
  const ok =
    !!provided &&
    Buffer.byteLength(provided) === Buffer.byteLength(expected) &&
    timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await ensureDemoSeeded();
  return NextResponse.json({ success: true, ...result });
}
