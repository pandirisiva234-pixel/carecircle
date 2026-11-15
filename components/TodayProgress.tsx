"use client";

import React from "react";
import { DoseEvent, Appointment, Role } from "@/lib/types";
import { formatTime12h } from "@/lib/utils";
import { Pill, CalendarClock, AlertTriangle, Sun, Sunset, Moon } from "lucide-react";

interface TodayProgressProps {
  elderName: string;
  viewerName: string;
  viewerRole: Role;
  doses: DoseEvent[];
  appointments: Appointment[];
  elderMode: boolean;
  highContrast: boolean;
}

function greetingFor(date: Date): { text: string; Icon: typeof Sun } {
  const h = date.getHours();
  if (h < 12) return { text: "Good morning", Icon: Sun };
  if (h < 17) return { text: "Good afternoon", Icon: Sunset };
  return { text: "Good evening", Icon: Moon };
}

/**
 * "Today at a glance": greeting, progress ring of doses taken, next dose and next appointment.
 * The elder sees it addressed to them; caretakers and family see it about the elder.
 */
export function TodayProgress({
  elderName,
  viewerName,
  viewerRole,
  doses,
  appointments,
  elderMode,
  highContrast,
}: TodayProgressProps) {
  const now = new Date();
  const total = doses.length;
  const taken = doses.filter((d) => d.status === "taken").length;
  const missed = doses.filter((d) => d.status === "missed").length;
  const pct = total > 0 ? Math.round((taken / total) * 100) : 0;

  const nextDose = doses
    .filter((d) => d.status === "scheduled" && new Date(d.scheduledTime).getTime() >= now.getTime() - 30 * 60000)
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))[0];

  const nextAppointment = appointments
    .filter((a) => new Date(a.dateTime).getTime() > now.getTime())
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())[0];

  const { text: greeting, Icon: GreetingIcon } = greetingFor(now);
  const isElderViewer = viewerRole === "elder";
  const firstName = (isElderViewer ? elderName : viewerName).split(" ")[0];

  // Progress ring geometry
  const size = elderMode ? 132 : 112;
  const stroke = elderMode ? 14 : 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const card = highContrast
    ? "bg-white border-2 border-black text-black shadow-[4px_4px_0px_#000000]"
    : "bg-gradient-to-br from-white via-white to-sky-50 border border-slate-200 shadow-sm";

  return (
    <section aria-labelledby="today-progress-heading" className={`rounded-3xl p-5 sm:p-7 ${card}`}>
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        {/* Progress ring */}
        <div className="flex items-center gap-5">
          <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={stroke}
                className={highContrast ? "stroke-slate-300" : "stroke-slate-100"}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className={`${highContrast ? "stroke-black" : "stroke-emerald-500"} motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`font-black leading-none ${elderMode ? "text-4xl" : "text-3xl"}`}>{taken}</span>
              <span className="text-xs font-bold text-slate-600 mt-1">of {total} taken</span>
            </div>
          </div>

          <div>
            <p className="flex items-center gap-1.5 text-sm font-bold text-sky-700">
              <GreetingIcon className="w-4 h-4" aria-hidden="true" />
              {greeting}, {firstName}
            </p>
            <h2
              id="today-progress-heading"
              className={`font-black tracking-tight text-slate-900 mt-1 ${elderMode ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"}`}
            >
              {total === 0
                ? "No doses scheduled today"
                : taken === total
                ? isElderViewer
                  ? "All done for today. Well done!"
                  : `${elderName.split(" ")[0]} has taken every dose today`
                : isElderViewer
                ? `${total - taken} ${total - taken === 1 ? "dose" : "doses"} left today`
                : `${elderName.split(" ")[0]} has ${total - taken} ${total - taken === 1 ? "dose" : "doses"} left today`}
            </h2>
            <p className="sr-only" role="status">
              {`${taken} of ${total} doses taken today, ${pct} percent.`}
            </p>
            {missed > 0 && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                {missed} missed {missed === 1 ? "dose" : "doses"} — family has been alerted
              </p>
            )}
          </div>
        </div>

        {/* Next dose / next appointment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:ml-auto md:min-w-[420px]">
          <div className={`rounded-2xl p-4 ${highContrast ? "border-2 border-black" : "bg-white border border-slate-200"}`}>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              <Pill className="w-4 h-4 text-sky-600" aria-hidden="true" /> Next dose
            </p>
            {nextDose ? (
              <>
                <p className={`font-black text-slate-900 mt-1 ${elderMode ? "text-xl" : "text-lg"}`}>
                  {formatTime12h(nextDose.scheduledTimeLocal)}
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {nextDose.medicationName} · {nextDose.dosage}
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold text-slate-600 mt-1">Nothing else due today</p>
            )}
          </div>

          <div className={`rounded-2xl p-4 ${highContrast ? "border-2 border-black" : "bg-white border border-slate-200"}`}>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              <CalendarClock className="w-4 h-4 text-violet-600" aria-hidden="true" /> Next appointment
            </p>
            {nextAppointment ? (
              <>
                <p className={`font-black text-slate-900 mt-1 ${elderMode ? "text-xl" : "text-lg"}`}>
                  {new Date(nextAppointment.dateTime).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                  {" · "}
                  {new Date(nextAppointment.dateTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                </p>
                <p className="text-sm font-semibold text-slate-700 truncate">
                  {nextAppointment.doctor} · {nextAppointment.specialty}
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold text-slate-600 mt-1">No upcoming visits</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
