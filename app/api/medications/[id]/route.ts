import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { medicationSchema } from "@/lib/validations";
import { getMedicationById, saveMedication, deleteMedication, logActivity, getMemberByCircleAndRole } from "@/lib/db";
import { sendEmail, buildScheduleChangeElderNotification } from "@/lib/email";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getMedicationById(id);
  if (!existing || existing.circleId !== session.circleId) {
    return NextResponse.json({ error: "Medication not found" }, { status: 404 });
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
    const updated = {
      ...existing,
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
      updatedAt: new Date().toISOString(),
    };

    await saveMedication(updated);

    await logActivity({
      circleId: session.circleId,
      memberId: session.memberId,
      memberName: session.name,
      memberRole: session.role,
      action: "MEDICATION_UPDATED",
      details: `Updated medication ${updated.name} (${updated.dosage})`,
      affectsElder: true,
    });

    if (session.role !== "elder") {
      const elder = await getMemberByCircleAndRole(session.circleId, "elder");
      if (elder?.email) {
        const notif = buildScheduleChangeElderNotification(
          session.elderName,
          session.name,
          session.role,
          `Updated medication details for ${updated.name}`
        );
        await sendEmail({
          to: elder.email,
          subject: notif.subject,
          text: notif.text,
          html: notif.html,
        });
      }
    }

    return NextResponse.json({ success: true, medication: updated });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Update Medication Error]:", errorMsg);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getMedicationById(id);
  if (!existing || existing.circleId !== session.circleId) {
    return NextResponse.json({ error: "Medication not found" }, { status: 404 });
  }

  await deleteMedication(id);

  await logActivity({
    circleId: session.circleId,
    memberId: session.memberId,
    memberName: session.name,
    memberRole: session.role,
    action: "MEDICATION_DELETED",
    details: `Removed medication ${existing.name}`,
    affectsElder: true,
  });

  if (session.role !== "elder") {
    const elder = await getMemberByCircleAndRole(session.circleId, "elder");
    if (elder?.email) {
      const notif = buildScheduleChangeElderNotification(
        session.elderName,
        session.name,
        session.role,
        `Discontinued / removed medication ${existing.name}`
      );
      await sendEmail({
        to: elder.email,
        subject: notif.subject,
        text: notif.text,
        html: notif.html,
      });
    }
  }

  return NextResponse.json({ success: true });
}
