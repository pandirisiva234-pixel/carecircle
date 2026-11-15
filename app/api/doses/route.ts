import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { doseUpdateSchema } from "@/lib/validations";
import {
  getDoseEvents,
  getAllDoseEvents,
  getMedications,
  saveDoseEvent,
  updateDoseEvent,
  logActivity,
} from "@/lib/db";
import {
  buildDoseEventsForDay,
  calculateAdherenceMetrics,
} from "@/lib/adherence";
import { todayInTz } from "@/lib/timezone";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const todayStr = todayInTz();
  const requestedDate = searchParams.get("date");
  const dateStr = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : todayStr;

  // 1. Fetch medications and existing events
  const medications = await getMedications(session.circleId);
  const existingEvents = await getDoseEvents(session.circleId, dateStr);

  // 2. Reconcile and save newly generated doses if any
  const dayDoses = buildDoseEventsForDay(medications, existingEvents, dateStr, session.circleId);
  for (const dose of dayDoses) {
    if (!existingEvents.some((e) => e.id === dose.id)) {
      await saveDoseEvent(dose);
    }
  }

  // 3. Calculate full adherence metrics across all circle doses for trends
  const allEvents = await getAllDoseEvents(session.circleId);
  const metrics = calculateAdherenceMetrics(allEvents);

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
