import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { appointmentSchema } from "@/lib/validations";
import { getAppointments, saveAppointment, deleteAppointment, logActivity } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const appointments = await getAppointments(session.circleId);
  const existing = appointments.find((a) => a.id === id);

  if (!existing) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const parsed = appointmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updated = {
      ...existing,
      doctor: data.doctor,
      specialty: data.specialty,
      dateTime: data.dateTime,
      location: data.location,
      notes: data.notes,
      updatedAt: new Date().toISOString(),
    };

    await saveAppointment(updated);

    await logActivity({
      circleId: session.circleId,
      memberId: session.memberId,
      memberName: session.name,
      memberRole: session.role,
      action: "APPOINTMENT_UPDATED",
      details: `Updated appointment with ${updated.doctor}`,
      affectsElder: true,
    });

    return NextResponse.json({ success: true, appointment: updated });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Update Appointment Error]:", errorMsg);
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
  const appointments = await getAppointments(session.circleId);
  const existing = appointments.find((a) => a.id === id);

  if (!existing) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  await deleteAppointment(id);

  await logActivity({
    circleId: session.circleId,
    memberId: session.memberId,
    memberName: session.name,
    memberRole: session.role,
    action: "APPOINTMENT_DELETED",
    details: `Cancelled appointment with ${existing.doctor}`,
    affectsElder: true,
  });

  return NextResponse.json({ success: true });
}
