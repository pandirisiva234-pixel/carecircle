"use client";

import React, { useState } from "react";
import { Clock, Play, CheckCircle2, AlertTriangle, ShieldCheck, Mail } from "lucide-react";

interface CronTesterModalProps {
  onTriggered: () => void;
  highContrast?: boolean;
}

export function CronTesterModal({ onTriggered, highContrast }: CronTesterModalProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRunCron() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cron/reminders", {
        method: "POST",
        headers: {
          "x-cron-secret": "carecircle-cron-secret-change-me",
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed running cron");
      }

      setResult(data);
      onTriggered();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`rounded-2xl p-5 sm:p-6 border transition-all ${
        highContrast
          ? "bg-white border-black text-black shadow-[4px_4px_0px_#000000]"
          : "bg-white border-slate-200 shadow-sm"
      }`}
      role="region"
      aria-label="Google Cloud Scheduler Simulation"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            <span>Automated 15-Min Reminders Engine (GitHub Actions & Cron)</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Automated Reminder & Escalation Engine
          </h3>
          <p className="text-sm text-slate-600 mt-0.5">
            Endpoint <code className="bg-slate-100 text-xs px-1.5 py-0.5 rounded font-mono">POST /api/cron/reminders</code> protected by CRON_SECRET header
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunCron}
          disabled={loading}
          className={`px-5 py-3 rounded-xl font-black text-white text-sm flex items-center justify-center space-x-2 shadow-sm transition-all ${
            highContrast
              ? "bg-black hover:bg-slate-900"
              : "bg-emerald-600 hover:bg-emerald-700"
          } ${loading ? "opacity-75 cursor-wait" : ""}`}
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{loading ? "Triggering Scheduler..." : "Run Scheduler Check Now"}</span>
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-semibold flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>Scheduler executed successfully at {new Date(result.timestamp).toLocaleTimeString()}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="bg-white p-2.5 rounded-lg border border-emerald-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500">Upcoming Doses</span>
              <div className="text-xl font-black text-slate-900">
                {result.report.upcomingDoseRemindersSent}
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-emerald-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500">Elder Missed Alerts</span>
              <div className="text-xl font-black text-slate-900">
                {result.report.elderMissedAlertsSent}
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-emerald-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500">Family Escalations</span>
              <div className="text-xl font-black text-slate-900">
                {result.report.familyEscalationsSent}
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-emerald-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500">24h Appointments</span>
              <div className="text-xl font-black text-slate-900">
                {result.report.appointment24hRemindersSent}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
