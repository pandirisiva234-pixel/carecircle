"use client";

import React, { useState } from "react";
import { DoseEvent, Role } from "@/lib/types";
import { formatTime12h } from "@/lib/utils";
import { CheckCircle2, Clock, AlertTriangle, RotateCcw, Check, Pill } from "lucide-react";

interface DoseCardProps {
  dose: DoseEvent;
  userRole: Role;
  elderMode: boolean;
  highContrast: boolean;
  onUpdateStatus: (doseId: string, status: "taken" | "missed" | "scheduled") => Promise<void>;
}

export function DoseCard({
  dose,
  userRole,
  elderMode,
  highContrast,
  onUpdateStatus,
}: DoseCardProps) {
  const [loading, setLoading] = useState(false);

  async function handleTake() {
    if (loading) return;
    setLoading(true);
    try {
      await onUpdateStatus(dose.id, "taken");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(status: "taken" | "missed" | "scheduled") {
    if (loading) return;
    setLoading(true);
    try {
      await onUpdateStatus(dose.id, status);
    } finally {
      setLoading(false);
    }
  }

  const isTaken = dose.status === "taken";
  const isMissed = dose.status === "missed";
  const isScheduled = dose.status === "scheduled";

  // Elder View High Impact Layout
  if (elderMode || userRole === "elder") {
    return (
      <article
        aria-label={`Dose for ${dose.medicationName}, ${dose.dosage} at ${formatTime12h(
          dose.scheduledTimeLocal
        )}. Status: ${dose.status}`}
        className={`rounded-2xl p-5 sm:p-6 transition-all border ${
          highContrast
            ? "bg-white border-black text-black shadow-[4px_4px_0px_#000000]"
            : isTaken
            ? "bg-emerald-50/80 border-emerald-300 shadow-sm"
            : isMissed
            ? "bg-red-50/80 border-red-300 shadow-sm"
            : "bg-white border-slate-200 shadow-sm hover:shadow-md"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          {/* Time & Medicine Details */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span
                className={`text-xl sm:text-2xl font-black px-3 py-1 rounded-xl inline-flex items-center space-x-1.5 ${
                  highContrast
                    ? "bg-black text-white"
                    : isTaken
                    ? "bg-emerald-200 text-emerald-950 font-bold"
                    : isMissed
                    ? "bg-red-200 text-red-950 font-bold"
                    : "bg-sky-100 text-sky-950 font-bold"
                }`}
              >
                <Clock className="w-5 h-5 inline mr-1" />
                <span>{formatTime12h(dose.scheduledTimeLocal)}</span>
              </span>

              {isTaken && (
                <span className="text-sm font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Taken</span>
                </span>
              )}
              {isMissed && (
                <span className="text-sm font-bold text-red-700 bg-red-100 border border-red-300 px-3 py-1 rounded-full flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Overdue</span>
                </span>
              )}
            </div>

            <h3
              className={`font-black text-slate-900 tracking-tight pt-1 ${
                elderMode ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
              }`}
            >
              {dose.medicationName}
            </h3>

            <p
              className={`font-bold text-slate-700 ${
                elderMode ? "text-lg sm:text-xl" : "text-base sm:text-lg"
              }`}
            >
              Dosage: <span className="text-sky-800">{dose.dosage}</span>
            </p>

            {isTaken && dose.takenAt && (
              <p className="text-xs sm:text-sm font-medium text-emerald-800 pt-1">
                Recorded at {new Date(dose.takenAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                {dose.takenByMemberName ? ` by ${dose.takenByMemberName}` : ""}
              </p>
            )}
          </div>

          {/* Large Elder "Taken" Button */}
          <div className="shrink-0 flex flex-col gap-2">
            {!isTaken ? (
              <button
                type="button"
                onClick={handleTake}
                disabled={loading}
                aria-label={`Mark ${dose.medicationName} as taken`}
                className={`w-full sm:w-auto min-w-[200px] px-8 py-5 rounded-2xl font-black text-xl sm:text-2xl flex items-center justify-center space-x-3 transition-transform active:scale-95 shadow-md ${
                  highContrast
                    ? "bg-[#15803d] text-white border-4 border-black hover:bg-[#166534]"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
                } ${loading ? "opacity-75 cursor-wait" : ""}`}
              >
                <Check className="w-8 h-8 stroke-[3]" />
                <span>{loading ? "Saving..." : "TAKEN"}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="px-6 py-4 rounded-2xl bg-emerald-100 border-2 border-emerald-400 text-emerald-900 font-extrabold text-lg flex items-center space-x-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                  <span>Dose Complete</span>
                </div>
                {/* Reset button for accidental click */}
                <button
                  type="button"
                  onClick={() => handleStatusChange("scheduled")}
                  disabled={loading}
                  title="Undo marked taken"
                  aria-label="Undo marked taken"
                  className="p-3 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </article>
    );
  }

  // Standard Caretaker / Family View Layout
  return (
    <article
      className={`rounded-xl p-4 transition-all border ${
        highContrast
          ? "bg-white border-black text-black"
          : isTaken
          ? "bg-emerald-50/50 border-emerald-200"
          : isMissed
          ? "bg-red-50/50 border-red-200"
          : "bg-white border-slate-200 hover:border-slate-300"
      } shadow-sm`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-bold ${
              isTaken
                ? "bg-emerald-100 text-emerald-700"
                : isMissed
                ? "bg-red-100 text-red-700"
                : "bg-sky-100 text-sky-700"
            }`}
          >
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {formatTime12h(dose.scheduledTimeLocal)}
              </span>
              <h4 className="font-bold text-slate-900 text-base">{dose.medicationName}</h4>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {dose.dosage}
              </span>
            </div>
            {isTaken && (
              <p className="text-xs text-emerald-700 font-medium mt-0.5">
                Taken at {new Date(dose.takenAt || "").toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                {dose.takenByMemberName ? ` (logged by ${dose.takenByMemberName})` : ""}
              </p>
            )}
            {isMissed && (
              <p className="text-xs text-red-600 font-medium mt-0.5">
                Overdue dose — reminders triggered
              </p>
            )}
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex items-center space-x-2 self-end sm:self-center">
          <button
            type="button"
            onClick={() => handleStatusChange("taken")}
            disabled={loading}
            aria-pressed={isTaken}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 ${
              isTaken
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200"
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Taken</span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange("missed")}
            disabled={loading}
            aria-pressed={isMissed}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 ${
              isMissed
                ? "bg-red-600 text-white shadow-sm"
                : "bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Missed</span>
          </button>

          {(!isScheduled || isTaken || isMissed) && (
            <button
              type="button"
              onClick={() => handleStatusChange("scheduled")}
              disabled={loading}
              title="Reset to Scheduled"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
