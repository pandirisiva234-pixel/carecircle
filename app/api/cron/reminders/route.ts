import { NextRequest, NextResponse } from "next/server";
import {
  getCircle,
  getMembersByCircle,
  getMedications,
  getDoseEvents,
  saveDoseEvent,
  updateDoseEvent,
  getAppointments,
  saveAppointment,
} from "@/lib/db";
import {
  buildDoseEventsForDay,
  evaluateDoseEscalation,
} from "@/lib/adherence";
import {
  sendEmail,
  buildUpcomingDoseEmail,
  buildMissedDoseElderEmail,
  buildEscalatedMissedDoseEmail,
  buildAppointment24hEmail,
} from "@/lib/email";
import { todayInTz, parseDateTimeInTz } from "@/lib/timezone";
import { getSession } from "@/lib/auth";
import { timingSafeEqual } from "crypto";

function secretsMatch(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Validate CRON_SECRET from header
    const cronSecret = process.env.CRON_SECRET?.trim().replace(/^"|"$/g, "");
    if (!cronSecret) {
      return NextResponse.json({ error: "CRON_SECRET is not configured on the server." }, { status: 503 });
    }
    const authHeader = req.headers.get("authorization");
    const secretHeader = req.headers.get("x-cron-secret");

    const providedSecret =
      secretHeader || (authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null);

    // Authorised callers: the scheduler (secret header) or a signed-in caretaker/family member
    // using the in-app "Run reminders now" button. The secret is never shipped to the browser.
    const session = secretsMatch(providedSecret, cronSecret) ? null : await getSession();
    const isSchedulerCall = secretsMatch(providedSecret, cronSecret);
    const isTrustedMember = !!session && (session.role === "caretaker" || session.role === "family");
    if (!isSchedulerCall && !isTrustedMember) {
      return NextResponse.json({ error: "Unauthorized. Invalid CRON_SECRET." }, { status: 401 });
    }

    const now = new Date();
    const todayStr = todayInTz(now);

    // For demonstration and active circle processing, process circle "CC-DEMO" and any active circles
    const circlesToProcess = ["CC-DEMO"];

    let upcomingCount = 0;
    let elderMissedCount = 0;
    let escalatedCount = 0;
    let appointmentCount = 0;

    for (const circleId of circlesToProcess) {
      const circle = await getCircle(circleId);
      if (!circle) continue;

      const members = await getMembersByCircle(circleId);
      const elderMember = members.find((m) => m.role === "elder");
      const supportMembers = members.filter((m) => m.role === "caretaker" || m.role === "family");

      // A. Reconcile today's doses
      const meds = await getMedications(circleId);
      const existingDoses = await getDoseEvents(circleId, todayStr);
      const todayDoses = buildDoseEventsForDay(meds, existingDoses, todayStr, circleId);

      for (const dose of todayDoses) {
        if (!existingDoses.some((e) => e.id === dose.id)) {
          await saveDoseEvent(dose);
        }
      }

      // Re-fetch all today's doses
      const currentDoses = await getDoseEvents(circleId, todayStr);

      // B. Upcoming Doses Check (scheduled within next 30 minutes, not yet taken)
      for (const dose of currentDoses) {
        if (dose.status === "scheduled") {
          const doseTime = new Date(dose.scheduledTime);
          const diffMinutes = Math.floor((doseTime.getTime() - now.getTime()) / (1000 * 60));

          // If scheduled in the next 0 to 30 minutes
          if (diffMinutes >= 0 && diffMinutes <= 30 && elderMember?.email) {
            const emailData = buildUpcomingDoseEmail(
              circle.elderName,
              dose.medicationName,
              dose.dosage,
              dose.scheduledTimeLocal
            );
            await sendEmail({
              to: elderMember.email,
              subject: emailData.subject,
              text: emailData.text,
              html: emailData.html,
            });
            upcomingCount++;
          }
        }
      }

      // C. Missed Doses & Escalation Check
      const escalationResult = evaluateDoseEscalation(currentDoses, now);

      // 1. Elder overdue notifications (< 30 minutes late)
      for (const overdueDose of escalationResult.elderReminders) {
        if (elderMember?.email) {
          const emailData = buildMissedDoseElderEmail(
            circle.elderName,
            overdueDose.medicationName,
            overdueDose.dosage,
            overdueDose.scheduledTimeLocal
          );
          await sendEmail({
            to: elderMember.email,
            subject: emailData.subject,
            text: emailData.text,
            html: emailData.html,
          });
          await updateDoseEvent(overdueDose.id, { missedReminderElderSent: true });
          elderMissedCount++;
        }
      }

      // 2. Escalation to Caretaker & Family (>= 30 minutes late)
      for (const escalatedDose of escalationResult.escalatedReminders) {
        for (const recipient of supportMembers) {
          if (recipient.email) {
            const emailData = buildEscalatedMissedDoseEmail(
              recipient.name,
              circle.elderName,
              escalatedDose.medicationName,
              escalatedDose.dosage,
              escalatedDose.scheduledTimeLocal
            );
            await sendEmail({
              to: recipient.email,
              subject: emailData.subject,
              text: emailData.text,
              html: emailData.html,
            });
          }
        }
        await updateDoseEvent(escalatedDose.id, {
          missedReminderEscalatedSent: true,
          status: "missed",
        });
        escalatedCount++;
      }

      // D. Appointments 24 Hours Ahead Check
      const appointments = await getAppointments(circleId);
      for (const apt of appointments) {
        if (apt.reminderSent) continue;

        // Appointment times without an explicit offset are in the circle's local timezone
        const aptTime = parseDateTimeInTz(apt.dateTime);
        const hoursUntil = (aptTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Within 23 to 25 hours window
        if (hoursUntil >= 23 && hoursUntil <= 25) {
          // Notify Elder and all Circle members
          for (const member of members) {
            if (member.email) {
              const emailData = buildAppointment24hEmail(
                member.name,
                circle.elderName,
                apt.doctor,
                apt.specialty,
                apt.dateTime,
                apt.location,
                apt.notes
              );
              await sendEmail({
                to: member.email,
                subject: emailData.subject,
                text: emailData.text,
                html: emailData.html,
              });
            }
          }
          await saveAppointment({ ...apt, reminderSent: true });
          appointmentCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      report: {
        circlesProcessed: circlesToProcess.length,
        upcomingDoseRemindersSent: upcomingCount,
        elderMissedAlertsSent: elderMissedCount,
        familyEscalationsSent: escalatedCount,
        appointment24hRemindersSent: appointmentCount,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Reminders Cron Error]:", errorMsg);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
