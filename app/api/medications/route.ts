import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { medicationSchema } from "@/lib/validations";
import { getMedications, saveMedication, logActivity, getMemberByCircleAndRole } from "@/lib/db";
import { sendEmail, buildScheduleChangeElderNotification } from "@/lib/email";
import { Medication } from "@/lib/types";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const medications = await getMedications(session.circleId);
  return NextResponse.json({ medications });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = medicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const now = new Date().toISOString();
    const medId = `med-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const medication: Medication = {
      id: medId,
      circleId: session.circleId,
      name: data.name,
      dosage: data.dosage,
      timesPerDay: data.timesPerDay,
      scheduleTimes: data.scheduleTimes,
      startDate: data.startDate,
      endDate: data.endDate || undefined,
      notes: data.notes,
      instructions: data.instructions,
      prescribedBy: data.prescribedBy,
      active: data.active,
      createdAt: now,
      updatedAt: now,
    };

    await saveMedication(medication);

    // Log Activity
    await logActivity({
      circleId: session.circleId,
      memberId: session.memberId,
      memberName: session.name,
      memberRole: session.role,
      action: "MEDICATION_CREATED",
      details: `Added new medication ${medication.name} (${medication.dosage}, ${medication.scheduleTimes.join(", ")})`,
      affectsElder: true,
    });

    // If updated by caretaker or family, notify the Elder so elder stays at centre
    if (session.role !== "elder") {
      const elder = await getMemberByCircleAndRole(session.circleId, "elder");
      if (elder?.email) {
        const notif = buildScheduleChangeElderNotification(
          session.elderName,
          session.name,
          session.role,
          `Added new medication: ${medication.name} (${medication.dosage})`
        );
        await sendEmail({
          to: elder.email,
          subject: notif.subject,
          text: notif.text,
          html: notif.html,
        });
      }
    }

    return NextResponse.json({ success: true, medication }, { status: 201 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Create Medication Error]:", errorMsg);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
