"use client";

import React from "react";
import { ActivityLog } from "@/lib/types";
import { History, UserCheck, Pill, Calendar, Bell, PlusCircle, CheckCircle } from "lucide-react";

interface ActivityLogViewProps {
  logs: ActivityLog[];
  highContrast?: boolean;
}

export function ActivityLogView({ logs, highContrast }: ActivityLogViewProps) {
  function getActionBadge(action: ActivityLog["action"]) {
    switch (action) {
      case "MEDICATION_CREATED":
      case "MEDICATION_UPDATED":
      case "MEDICATION_DELETED":
        return {
          icon: <Pill className="w-3.5 h-3.5" />,
          color: "bg-sky-100 text-sky-800 border-sky-200",
          label: "Medication",
        };
      case "DOSE_TAKEN":
        return {
          icon: <CheckCircle className="w-3.5 h-3.5" />,
          color: "bg-emerald-100 text-emerald-800 border-emerald-200",
          label: "Dose Taken",
        };
      case "DOSE_MISSED":
        return {
          icon: <Bell className="w-3.5 h-3.5" />,
          color: "bg-red-100 text-red-800 border-red-200",
          label: "Dose Overdue",
        };
      case "APPOINTMENT_CREATED":
      case "APPOINTMENT_UPDATED":
      case "APPOINTMENT_DELETED":
        return {
          icon: <Calendar className="w-3.5 h-3.5" />,
          color: "bg-indigo-100 text-indigo-800 border-indigo-200",
          label: "Appointment",
        };
      case "CIRCLE_CREATED":
      case "MEMBER_JOINED":
        return {
          icon: <UserCheck className="w-3.5 h-3.5" />,
          color: "bg-purple-100 text-purple-800 border-purple-200",
          label: "Circle Event",
        };
      default:
        return {
          icon: <History className="w-3.5 h-3.5" />,
          color: "bg-slate-100 text-slate-800 border-slate-200",
          label: "System",
        };
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
      aria-label="Care Circle Activity Log"
    >
      <div className="flex items-center space-x-2 pb-4 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
          <History className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900">Activity Log</h3>
          <p className="text-xs text-slate-500">Transparent audit trail of every schedule change</p>
        </div>
      </div>

      <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-1">
        {logs.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No activity recorded yet.</p>
        ) : (
          logs.map((log) => {
            const badge = getActionBadge(log.action);
            const timeAgo = new Date(log.timestamp).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            });

            return (
              <div
                key={log.id}
                className="flex items-start space-x-3 p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors"
              >
                <div
                  className={`mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold border flex items-center space-x-1 shrink-0 ${badge.color}`}
                >
                  {badge.icon}
                  <span>{badge.label}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                    {log.details}
                  </p>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1">
                    <span className="font-bold text-slate-700">{log.memberName}</span>
                    <span>•</span>
                    <span className="capitalize">{log.memberRole}</span>
                    <span>•</span>
                    <time dateTime={log.timestamp}>{timeAgo}</time>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
