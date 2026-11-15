import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { doseUpdateSchema } from "@/lib/validations";
import {
  getAllDoseEvents,
  getDoseEventById,
  getMedications,
  saveDoseEvents,
  updateDoseEvent,
  logActivity,
} from "@/lib/db";
import { buildDoseEventsForDay, calculateAdherenceMetrics } from "@/lib/adherence";
import { todayInTz, addDays } from "@/lib/timezone";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const todayStr = todayInTz();
  const requestedDate = searchParams.get("date");
  const dateStr = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : todayStr;

  // 1. Two reads in parallel: medications + all dose events (one query, filtered in memory)
  const [medications, allEvents] = await Promise.all([
    getMedications(session.circleId),
    getAllDoseEvents(session.circleId),
  ]);
  const existingForDay = allEvents.filter((e) => e.scheduledDate === dateStr);

  // 2. Reconcile the day's schedule and persist only the newly generated doses, in one batch
  const dayDoses = buildDoseEventsForDay(medications, existingForDay, dateStr, session.circleId);
  const existingIds = new Set(existingForDay.map((e) => e.id));
  const newDoses = dayDoses.filter((d) => !existingIds.has(d.id));
  await saveDoseEvents(newDoses);

  // 3. Adherence metrics only need the last 7 days
  const weekStart = addDays(todayStr, -6);
  const recentEvents = [...allEvents.filter((e) => e.scheduledDate >= weekStart && e.scheduledDate !== dateStr), ...dayDoses];
  const metrics = calculateAdherenceMetrics(recentEvents);

  return NextResponse.json({
    date: dateStr,
    doses: dayDoses,
    metrics,
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = doseUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { doseEventId, status } = parsed.data;
    const now = new Date().toISOString();

    const updates = {
      status,
      takenAt: status === "taken" ? now : undefined,
      takenByMemberId: status === "taken" ? session.memberId : undefined,
      takenByMemberName: status === "taken" ? session.name : undefined,
    };

    // Authorisation: a member may only change doses that belong to their own circle (single-doc read)
    const target = await getDoseEventById(doseEventId);
    if (!target || target.circleId !== session.circleId) {
      return NextResponse.json({ error: "Dose event not found" }, { status: 404 });
    }

    const updated = await updateDoseEvent(doseEventId, updates);
    if (!updated) {
      return NextResponse.json({ error: "Dose event not found" }, { status: 404 });
    }

    // Log Activity
    await logActivity({
      circleId: session.circleId,
      memberId: session.memberId,
      memberName: session.name,
      memberRole: session.role,
      action: status === "taken" ? "DOSE_TAKEN" : "DOSE_MISSED",
      details:
        status === "taken"
          ? `${session.name} marked ${updated.medicationName} (${updated.dosage}) as TAKEN`
          : `${session.name} marked ${updated.medicationName} (${updated.dosage}) as MISSED`,
      affectsElder: true,
    });

    return NextResponse.json({ success: true, dose: updated });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Update Dose Error]:", errorMsg);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
