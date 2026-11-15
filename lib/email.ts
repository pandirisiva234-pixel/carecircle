import nodemailer from "nodemailer";

const clean = (v?: string) => v?.trim().replace(/^"|"$/g, "");
const GMAIL_USER = clean(process.env.GMAIL_USER);
// Gmail shows app passwords in groups of 4 ("abcd efgh ijkl mnop"); spaces are not part of the password
const GMAIL_APP_PASSWORD = clean(process.env.GMAIL_APP_PASSWORD)?.replace(/\s+/g, "");

/** True only when real Gmail credentials are configured (not empty or a placeholder). */
export function isEmailConfigured(): boolean {
  return (
    !!GMAIL_USER &&
    !!GMAIL_APP_PASSWORD &&
    GMAIL_APP_PASSWORD.length === 16 &&
    !/PASTE|your-|change-me/i.test(GMAIL_APP_PASSWORD) &&
    GMAIL_USER !== "carecircle.alerts@gmail.com"
  );
}

/** Demo accounts use reserved example addresses; never try to deliver real mail to them. */
export function isDemoAddress(email: string): boolean {
  return /\.demo@carecircle\.app$/i.test(email);
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  if (!isEmailConfigured()) {
    return null;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });

  return transporter;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; simulated?: boolean; messageId?: string; error?: string }> {
  const mailer = isDemoAddress(options.to) ? null : getTransporter();

  if (!mailer) {
    console.log(`[CareCircle Email Simulated] To: ${options.to} | Subject: "${options.subject}"`);
    console.log(`[CareCircle Email Body] ${options.text.substring(0, 150)}...`);
    return {
      success: true,
      simulated: true,
      messageId: `simulated-${Date.now()}`,
    };
  }

  try {
    // Never let a slow SMTP server hold up the user's request
    const info = await Promise.race([
      mailer.sendMail({
      from: `"CareCircle Alerts" <${GMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("SMTP timeout after 8s")), 8000)),
    ]);

    console.log(`[CareCircle Email Sent] ID: ${info.messageId} to ${options.to}`);
    return {
      success: true,
      simulated: false,
      messageId: info.messageId,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[CareCircle Email Failed] to ${options.to}:`, errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

// ==========================================
// Email Templates
// ==========================================

export function buildUpcomingDoseEmail(elderName: string, medName: string, dosage: string, scheduledTime: string) {
  const subject = `⏰ Reminder: Time for ${elderName}'s ${medName} (${dosage})`;
  const text = `Hi ${elderName},\n\nIt is time for your scheduled medication: ${medName} - ${dosage} at ${scheduledTime}.\n\nPlease take it as directed and mark it on your CareCircle dashboard.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="background: #0284c7; color: white; padding: 16px; border-radius: 8px; text-align: center;">
        <h2 style="margin: 0;">CareCircle Medication Reminder</h2>
      </div>
      <div style="padding: 20px 0;">
        <p style="font-size: 18px; color: #1e293b;">Hello <strong>${elderName}</strong>,</p>
        <p style="font-size: 16px; color: #334155;">It's time to take your scheduled dose:</p>
        <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 16px; margin: 16px 0; border-radius: 4px;">
          <h3 style="margin: 0 0 8px 0; color: #0369a1; font-size: 20px;">${medName}</h3>
          <p style="margin: 4px 0; font-size: 16px;"><strong>Dosage:</strong> ${dosage}</p>
          <p style="margin: 4px 0; font-size: 16px;"><strong>Scheduled Time:</strong> ${scheduledTime}</p>
        </div>
        <p style="font-size: 14px; color: #64748b;">Please log in to your CareCircle dashboard to mark this dose as taken.</p>
      </div>
    </div>
  `;
  return { subject, text, html };
}

export function buildMissedDoseElderEmail(elderName: string, medName: string, dosage: string, scheduledTime: string) {
  const subject = `⚠️ Overdue Dose Notice: ${medName} (${dosage})`;
  const text = `Hello ${elderName},\n\nYour dose of ${medName} (${dosage}) scheduled for ${scheduledTime} hasn't been marked as taken yet.\n\nPlease take your medication as soon as possible and tap "Taken" on your CareCircle screen.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #fecaca; border-radius: 12px; background: #ffffff;">
      <div style="background: #dc2626; color: white; padding: 16px; border-radius: 8px; text-align: center;">
        <h2 style="margin: 0;">CareCircle Overdue Dose Alert</h2>
      </div>
      <div style="padding: 20px 0;">
        <p style="font-size: 18px; color: #1e293b;">Hello <strong>${elderName}</strong>,</p>
        <p style="font-size: 16px; color: #b91c1c;">Your medication dose is overdue:</p>
        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 16px 0; border-radius: 4px;">
          <h3 style="margin: 0 0 8px 0; color: #991b1b; font-size: 20px;">${medName}</h3>
          <p style="margin: 4px 0; font-size: 16px;"><strong>Dosage:</strong> ${dosage}</p>
          <p style="margin: 4px 0; font-size: 16px;"><strong>Was Scheduled For:</strong> ${scheduledTime}</p>
        </div>
        <p style="font-size: 15px; color: #334155;">If you have already taken it, please press the <strong>"Taken"</strong> button on CareCircle.</p>
      </div>
    </div>
  `;
  return { subject, text, html };
}

export function buildEscalatedMissedDoseEmail(
  recipientName: string,
  elderName: string,
  medName: string,
  dosage: string,
  scheduledTime: string
) {
  const subject = `🚨 URGENT Care Escalation: ${elderName} missed dose of ${medName}`;
  const text = `Hello ${recipientName},\n\nThis is an urgent CareCircle escalation. ${elderName} has not confirmed taking ${medName} (${dosage}), which was scheduled for ${scheduledTime} (>30 minutes ago).\n\nPlease check in on ${elderName}.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 2px solid #ef4444; border-radius: 12px; background: #ffffff;">
      <div style="background: #b91c1c; color: white; padding: 18px; border-radius: 8px; text-align: center;">
        <h2 style="margin: 0;">🚨 Urgent CareCircle Escalation Alert</h2>
      </div>
      <div style="padding: 20px 0;">
        <p style="font-size: 18px; color: #1e293b;">Hello <strong>${recipientName}</strong>,</p>
        <p style="font-size: 16px; color: #7f1d1d; font-weight: bold;">
          ${elderName} has not recorded their dose after 30+ minutes:
        </p>
        <div style="background: #fff1f2; border-left: 5px solid #e11d48; padding: 16px; margin: 16px 0; border-radius: 6px;">
          <h3 style="margin: 0 0 8px 0; color: #be123c; font-size: 22px;">${medName} (${dosage})</h3>
          <p style="margin: 4px 0; font-size: 16px;"><strong>Scheduled Time:</strong> ${scheduledTime}</p>
          <p style="margin: 4px 0; font-size: 16px;"><strong>Status:</strong> Unconfirmed / Missed</p>
        </div>
        <div style="background: #f1f5f9; padding: 14px; border-radius: 8px; margin-top: 18px;">
          <p style="margin: 0; font-size: 15px; color: #334155;">
            <strong>Recommended Action:</strong> Please call or visit ${elderName} to verify their well-being and assist with medication administration.
          </p>
        </div>
      </div>
    </div>
  `;
  return { subject, text, html };
}

export function buildAppointment24hEmail(
  recipientName: string,
  elderName: string,
  doctor: string,
  specialty: string,
  dateTime: string,
  location: string,
  notes: string
) {
  const formattedDate = new Date(dateTime).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const subject = `📅 Appointment Reminder: ${elderName} has a visit tomorrow with ${doctor}`;
  const text = `Hello ${recipientName},\n\nUpcoming appointment for ${elderName}:\nDoctor: ${doctor} (${specialty})\nWhen: ${formattedDate}\nWhere: ${location}\nNotes: ${notes}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 12px; background: #ffffff;">
      <div style="background: #4f46e5; color: white; padding: 16px; border-radius: 8px; text-align: center;">
        <h2 style="margin: 0;">CareCircle Appointment Reminder</h2>
      </div>
      <div style="padding: 20px 0;">
        <p style="font-size: 18px; color: #1e293b;">Hello <strong>${recipientName}</strong>,</p>
        <p style="font-size: 16px; color: #334155;">This is a 24-hour reminder for ${elderName}'s upcoming medical appointment:</p>
        <div style="background: #eef2ff; border-left: 4px solid #4f46e5; padding: 16px; margin: 16px 0; border-radius: 4px;">
          <h3 style="margin: 0 0 8px 0; color: #3730a3; font-size: 20px;">${doctor} (${specialty})</h3>
          <p style="margin: 6px 0; font-size: 16px;"><strong>Date & Time:</strong> ${formattedDate}</p>
          <p style="margin: 6px 0; font-size: 16px;"><strong>Location:</strong> ${location}</p>
          ${notes ? `<p style="margin: 6px 0; font-size: 15px; color: #475569;"><strong>Notes:</strong> ${notes}</p>` : ""}
        </div>
      </div>
    </div>
  `;
  return { subject, text, html };
}

export function buildScheduleChangeElderNotification(
  elderName: string,
  editorName: string,
  editorRole: string,
  changeSummary: string
) {
  const subject = `🔔 CareCircle Notice: Your care schedule was updated by ${editorName}`;
  const text = `Hello ${elderName},\n\n${editorName} (${editorRole}) made a change to your care schedule: "${changeSummary}".\n\nYou remain at the centre of your care decisions. View your updated schedule in CareCircle.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #bae6fd; border-radius: 12px; background: #ffffff;">
      <div style="background: #0284c7; color: white; padding: 16px; border-radius: 8px; text-align: center;">
        <h2 style="margin: 0;">Care Plan Update Notice</h2>
      </div>
      <div style="padding: 20px 0;">
        <p style="font-size: 18px; color: #1e293b;">Hello <strong>${elderName}</strong>,</p>
        <p style="font-size: 16px; color: #334155;">
          Your schedule was updated by your ${editorRole}, <strong>${editorName}</strong>:
        </p>
        <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 16px; margin: 16px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 16px; color: #0369a1; font-weight: 600;">${changeSummary}</p>
        </div>
        <p style="font-size: 14px; color: #64748b;">
          At CareCircle, you are at the center of all care decisions. Please open your CareCircle app to review your updated schedule.
        </p>
      </div>
    </div>
  `;
  return { subject, text, html };
}
