"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SessionUser } from "@/lib/types";
import { Heart, LogOut, Sun, Moon, Volume2, Shield, User, Users } from "lucide-react";

interface NavbarProps {
  user: SessionUser;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  elderMode: boolean;
  onToggleElderMode: () => void;
}

export function Navbar({
  user,
  highContrast,
  onToggleHighContrast,
  elderMode,
  onToggleElderMode,
}: NavbarProps) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Logout error", err);
    }
  }

  const roleColors = {
    elder: "bg-purple-100 text-purple-800 border-purple-300",
    caretaker: "bg-sky-100 text-sky-800 border-sky-300",
    family: "bg-emerald-100 text-emerald-800 border-emerald-300",
  };

  const roleIcons = {
    elder: "👵",
    caretaker: "👩‍⚕️",
    family: "👨‍👩‍👧",
  };

  return (
    <header
      role="banner"
      className={`border-b transition-colors ${
        highContrast ? "bg-white border-black text-black" : "bg-white/95 backdrop-blur-md border-slate-200"
      } sticky top-0 z-40 px-4 sm:px-6 py-3 shadow-sm`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Circle Details */}
        <div className="flex items-center space-x-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
              highContrast ? "bg-black" : "bg-gradient-to-tr from-sky-600 to-sky-500"
            }`}
            aria-hidden="true"
          >
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-extrabold tracking-tight text-slate-900">CareCircle</span>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-300">
                {user.circleId}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Circle for <span className="font-semibold text-slate-800">{user.elderName}</span>
            </p>
          </div>
        </div>

        {/* Accessibility & Role Controls */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* Elder Mode Toggle */}
          <button
            type="button"
            onClick={onToggleElderMode}
            aria-pressed={elderMode}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center space-x-1.5 transition-all border ${
              elderMode
                ? "bg-amber-100 text-amber-900 border-amber-400 shadow-sm"
                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
            }`}
            title="Toggle Elder Mode (Extra Large Text & Simple Controls)"
          >
            <span className="text-base" aria-hidden="true">👵</span>
            <span>{elderMode ? "Elder Mode: ON" : "Elder Mode"}</span>
          </button>

          {/* High Contrast Mode Toggle */}
          <button
            type="button"
            onClick={onToggleHighContrast}
            aria-pressed={highContrast}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center space-x-1.5 transition-all border ${
              highContrast
                ? "bg-black text-white border-black"
                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
            }`}
            title="Toggle High Contrast for Visual Clarity"
          >
            {highContrast ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="hidden sm:inline">{highContrast ? "Standard" : "High Contrast"}</span>
          </button>

          {/* User Badge */}
          <div
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${
              roleColors[user.role]
            }`}
          >
            <span className="text-base" aria-hidden="true">{roleIcons[user.role]}</span>
            <div className="flex flex-col text-left">
              <span className="font-bold leading-tight">{user.name}</span>
              <span className="text-[10px] uppercase tracking-wider opacity-80">{user.role}</span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out of CareCircle"
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
