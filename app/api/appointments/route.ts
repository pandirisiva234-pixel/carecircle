import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { appointmentSchema } from "@/lib/validations";
import { getAppointments, saveAppointment, logActivity, getMemberByCircleAndRole } from "@/lib/db";
import { sendEmail, buildScheduleChangeElderNotification } from "@/lib/email";
import { Appointment } from "@/lib/types";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appointments = await getAppointments(session.circleId);
  // Sort upcoming first
  appointments.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  return NextResponse.json({ appointments });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const now = new Date().toISOString();
    const appointmentId = `apt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const appointment: Appointment = {
      id: appointmentId,
      circleId: session.circleId,
      doctor: data.doctor,
      specialty: data.specialty,
      dateTime: data.dateTime,
      location: data.location,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    };

    await saveAppointment(appointment);

    await logActivity({
      circleId: session.circleId,
      memberId: session.memberId,
      memberName: session.name,
      memberRole: session.role,
      action: "APPOINTMENT_CREATED",
      details: `Scheduled appointment with ${appointment.doctor} (${appointment.specialty}) on ${new Date(appointment.dateTime).toLocaleDateString()}`,
      affectsElder: true,
    });

    if (session.role !== "elder") {
      const elder = await getMemberByCircleAndRole(session.circleId, "elder");
      if (elder?.email) {
        const notif = buildScheduleChangeElderNotification(
          session.elderName,
          session.name,
          session.role,
          `New appointment booked with ${appointment.doctor} (${appointment.specialty})`
        );
        await sendEmail({
          to: elder.email,
          subject: notif.subject,
          text: notif.text,
          html: notif.html,
        });
      }
    }

    return NextResponse.json({ success: true, appointment }, { status: 201 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Create Appointment Error]:", errorMsg);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
