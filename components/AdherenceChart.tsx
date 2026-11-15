"use client";

import React from "react";
import { AdherenceSummary } from "@/lib/adherence";
import { TrendingUp, CheckCircle2, XCircle, Clock } from "lucide-react";

interface AdherenceChartProps {
  metrics: AdherenceSummary;
  highContrast?: boolean;
}

export function AdherenceChart({ metrics, highContrast }: AdherenceChartProps) {
  const { overallRate, totalDoses, takenDoses, missedDoses, pendingDoses, weeklyTrend } = metrics;

  return (
    <div
      className={`rounded-2xl p-5 sm:p-6 border transition-all ${
        highContrast
          ? "bg-white border-black text-black shadow-[4px_4px_0px_#000000]"
          : "bg-white border-slate-200 shadow-sm"
      }`}
      role="region"
      aria-label="Medication Adherence Statistics and 7-day trend"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2 text-sky-700 font-bold text-xs uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" />
            <span>Adherence Health Overview</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Weekly Medication Adherence
          </h3>
          <p className="text-sm text-slate-600 mt-0.5">
            Real-time compliance tracking across scheduled doses
          </p>
        </div>

        {/* Large Score Metric */}
        <div className="flex items-center space-x-4 bg-slate-50 border border-slate-200 px-5 py-3 rounded-2xl">
          <div className="text-right">
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Adherence Score</span>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {overallRate}%
            </div>
          </div>
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-white shadow-sm ${
              overallRate >= 80
                ? "bg-emerald-600"
                : overallRate >= 60
                ? "bg-amber-500"
                : "bg-red-500"
            }`}
          >
            {overallRate >= 80 ? "✓" : "!"}
          </div>
        </div>
      </div>

      {/* Metric Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Scheduled</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalDoses}</div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          <div className="flex items-center space-x-1 text-emerald-800 text-xs font-semibold uppercase">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Taken</span>
          </div>
          <div className="text-2xl font-bold text-emerald-900 mt-1">{takenDoses}</div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <div className="flex items-center space-x-1 text-red-800 text-xs font-semibold uppercase">
            <XCircle className="w-3.5 h-3.5" />
            <span>Missed</span>
          </div>
          <div className="text-2xl font-bold text-red-900 mt-1">{missedDoses}</div>
        </div>

        <div className="bg-sky-50 border border-sky-200 rounded-xl p-3">
          <div className="flex items-center space-x-1 text-sky-800 text-xs font-semibold uppercase">
            <Clock className="w-3.5 h-3.5" />
            <span>Upcoming</span>
          </div>
          <div className="text-2xl font-bold text-sky-900 mt-1">{pendingDoses}</div>
        </div>
      </div>

      {/* 7-Day Visual SVG Bar Chart */}
      <div className="mt-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          7-Day Adherence Trend
        </h4>
        <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 pt-4 px-2 bg-slate-50/70 border border-slate-200 rounded-xl">
          {weeklyTrend.map((day, idx) => {
            const heightPercent = Math.max(day.rate, 12);
            const isToday = idx === weeklyTrend.length - 1;

            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center h-full justify-end group relative"
              >
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity absolute -top-10 bg-slate-900 text-white text-[11px] font-semibold py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10 shadow-lg">
                  {day.date}: {day.taken}/{day.taken + day.missed} taken ({day.rate}%)
                </div>

                {/* Percentage label above bar */}
                <span className="text-[10px] font-bold text-slate-500 mb-1">
                  {day.rate}%
                </span>

                {/* Bar */}
                <div
                  className="w-full max-w-[42px] rounded-t-lg transition-all"
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: highContrast
                      ? isToday
                        ? "#000000"
                        : "#475569"
                      : day.rate >= 80
                      ? "#059669"
                      : day.rate >= 50
                      ? "#d97706"
                      : "#dc2626",
                  }}
                  tabIndex={0}
                  aria-label={`${day.dayLabel} ${day.date}: ${day.rate}% adherence`}
                />

                {/* Day Label */}
                <span
                  className={`text-xs mt-2 font-bold ${
                    isToday ? "text-sky-700 underline font-black" : "text-slate-600"
                  }`}
                >
                  {day.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
