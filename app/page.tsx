"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@/lib/types";
import {
  Heart,
  Shield,
  Clock,
  Sparkles,
  Volume2,
  Users,
  CheckCircle2,
  ArrowRight,
  Lock,
  Calendar,
  AlertTriangle,
  Stethoscope,
  Pill,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  const [authTab, setAuthTab] = useState<"demo" | "login" | "create" | "join">("demo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual Login State
  const [loginCircleId, setLoginCircleId] = useState("CC-DEMO");
  const [loginRole, setLoginRole] = useState<Role>("elder");
  const [loginPasscode, setLoginPasscode] = useState("");

  // Create Circle State
  const [createElderName, setCreateElderName] = useState("");
  const [createElderAge, setCreateElderAge] = useState<number>(75);
  const [createElderConditions, setCreateElderConditions] = useState("Hypertension, Type 2 Diabetes");
  const [createCircleName, setCreateCircleName] = useState("");
  const [createElderPasscode, setCreateElderPasscode] = useState("1234");
  const [createElderEmail, setCreateElderEmail] = useState("");
  const [createCreatorRole, setCreateCreatorRole] = useState<Role>("caretaker");
  const [createCreatorName, setCreateCreatorName] = useState("");
  const [createCreatorPasscode, setCreateCreatorPasscode] = useState("5678");
  const [createCreatorEmail, setCreateCreatorEmail] = useState("");
  const [createEmergencyContact, setCreateEmergencyContact] = useState("");

  // Join Circle State
  const [joinCircleId, setJoinCircleId] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinRole, setJoinRole] = useState<Role>("family");
  const [joinPasscode, setJoinPasscode] = useState("");
  const [joinEmail, setJoinEmail] = useState("");
  const [joinPhone, setJoinPhone] = useState("");

  // 1-Click Demo Login Handler for Judges
  async function handleDemoLogin(role: Role) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Demo login failed");
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Manual Login Handler
  async function handleManualLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          circleId: loginCircleId.trim().toUpperCase(),
          role: loginRole,
          passcode: loginPasscode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Create Circle Handler
  async function handleCreateCircle(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const conditions = createElderConditions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/auth/create-circle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          elderName: createElderName,
          elderAge: Number(createElderAge),
          elderConditions: conditions,
          circleName: createCircleName,
          elderPasscode: createElderPasscode,
          elderEmail: createElderEmail,
          creatorName: createCreatorName,
          creatorRole: createCreatorRole,
          creatorPasscode: createCreatorPasscode,
          creatorEmail: createCreatorEmail,
          emergencyContact: createEmergencyContact,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed creating circle");
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Join Circle Handler
  async function handleJoinCircle(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/join-circle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          circleId: joinCircleId.trim().toUpperCase(),
          memberName: joinName,
          role: joinRole,
          passcode: joinPasscode,
          email: joinEmail,
          phone: joinPhone || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed joining circle");
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-sky-200">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-500 text-white flex items-center justify-center font-bold shadow-sm">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-xl font-black text-slate-900 tracking-tight">CareCircle</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                Elderly Care & Medication Platform
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setAuthTab("demo")}
              className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-colors"
            >
              ⚡ Instant Demo Credentials
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero & Auth Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Mission, Features & Google Tech */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
              <Shield className="w-3.5 h-3.5" />
              <span>WCAG Accessible • Google Cloud Run Ready • Gemini Multimodal</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Elder-centered care, <span className="text-sky-600">coordinated as a family.</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
              CareCircle keeps elders at the center of their healthcare decisions while giving caretakers and family members shared visibility, automated escalation reminders, and Gemini AI prescription scanning.
            </p>
          </div>

          {/* Key Value Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">One-Tap Elder View</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Large buttons, high-contrast mode, and Web Speech API reading today&apos;s medicines out loud.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Gemini 2.5 Flash Vision</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Snap a photo of any prescription label to extract medicine names, dosages, and timings as structured JSON.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Cloud Scheduler Escalation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                15-min cron checks: reminds the elder first; escalates to family if still missed after 30 minutes.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Appointments & Activity Audit</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Doctor visit tracking with 24-hour advance email reminders and a transparent log of every change.
              </p>
            </div>
          </div>

          {/* Architecture Badge */}
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-bold uppercase tracking-wider text-slate-500 block">
              Google Cloud & Production Stack
            </span>
            <p>
              Built with Next.js 15 (App Router, Standalone Docker output for Cloud Run), Google Cloud Firestore (via firebase-admin), Gemini 2.5 Flash API (@google/genai), and Gmail SMTP Nodemailer.
            </p>
          </div>
        </div>

        {/* Right Column: Interactive Login & Demo Card */}
        <div className="lg:col-span-5 w-full">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            {/* Tab Switcher */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setAuthTab("demo")}
                className={`py-2 rounded-xl transition-all ${
                  authTab === "demo" ? "bg-white text-sky-700 shadow-sm font-extrabold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Judge Demo
              </button>
              <button
                type="button"
                onClick={() => setAuthTab("login")}
                className={`py-2 rounded-xl transition-all ${
                  authTab === "login" ? "bg-white text-sky-700 shadow-sm font-extrabold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setAuthTab("create")}
                className={`py-2 rounded-xl transition-all ${
                  authTab === "create" ? "bg-white text-sky-700 shadow-sm font-extrabold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Create Circle
              </button>
              <button
                type="button"
                onClick={() => setAuthTab("join")}
                className={`py-2 rounded-xl transition-all ${
                  authTab === "join" ? "bg-white text-sky-700 shadow-sm font-extrabold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Join
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-bold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* TAB 1: JUDGE QUICK-START DEMO CREDENTIALS */}
            {authTab === "demo" && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
                    Instant Evaluation Access
                  </span>
                  <h2 className="text-2xl font-black text-slate-900">
                    Welcome Judges & Reviewers
                  </h2>
                  <p className="text-xs text-slate-500">
                    Pre-seeded circle <strong className="font-mono text-slate-900">CC-DEMO</strong> with medications, appointments, and activity logs.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  {/* Elder 1-Click Button */}
                  <button
                    type="button"
                    onClick={() => handleDemoLogin("elder")}
                    disabled={loading}
                    className="w-full p-4 rounded-2xl border-2 border-purple-200 hover:border-purple-400 bg-purple-50/60 hover:bg-purple-50 flex items-center justify-between text-left transition-all group"
                  >
                    <div className="flex items-center space-x-3.5">
                      <span className="text-3xl" aria-hidden="true">👵</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-extrabold text-slate-900 text-base">Margaret Jenkins (Elder)</h3>
                          <span className="text-[10px] bg-purple-200 text-purple-900 font-bold px-1.5 py-0.5 rounded">
                            Passcode: 1234
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          High contrast, voice read-aloud TTS, giant &quot;Taken&quot; buttons
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Caretaker 1-Click Button */}
                  <button
                    type="button"
                    onClick={() => handleDemoLogin("caretaker")}
                    disabled={loading}
                    className="w-full p-4 rounded-2xl border-2 border-sky-200 hover:border-sky-400 bg-sky-50/60 hover:bg-sky-50 flex items-center justify-between text-left transition-all group"
                  >
                    <div className="flex items-center space-x-3.5">
                      <span className="text-3xl" aria-hidden="true">👩‍⚕️</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-extrabold text-slate-900 text-base">Sarah Jenkins (Caretaker)</h3>
                          <span className="text-[10px] bg-sky-200 text-sky-900 font-bold px-1.5 py-0.5 rounded">
                            Passcode: 5678
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Manage medications, scan prescriptions, schedule appointments
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-sky-600 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Family 1-Click Button */}
                  <button
                    type="button"
                    onClick={() => handleDemoLogin("family")}
                    disabled={loading}
                    className="w-full p-4 rounded-2xl border-2 border-emerald-200 hover:border-emerald-400 bg-emerald-50/60 hover:bg-emerald-50 flex items-center justify-between text-left transition-all group"
                  >
                    <div className="flex items-center space-x-3.5">
                      <span className="text-3xl" aria-hidden="true">👨‍👩‍👧</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-extrabold text-slate-900 text-base">David Jenkins (Family)</h3>
                          <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.5 rounded">
                            Passcode: 9999
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Adherence tracking, receive missed dose escalations
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: MANUAL LOGIN */}
            {authTab === "login" && (
              <form onSubmit={handleManualLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Care Circle ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CC-DEMO"
                    value={loginCircleId}
                    onChange={(e) => setLoginCircleId(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Your Role in the Circle
                  </label>
                  <select
                    value={loginRole}
                    onChange={(e) => setLoginRole(e.target.value as Role)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 bg-white"
                  >
                    <option value="elder">👵 Elder (Centre of Care)</option>
                    <option value="caretaker">👩‍⚕️ Caretaker</option>
                    <option value="family">👨‍👩‍👧 Family Member</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Personal Passcode
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="4-digit passcode"
                    value={loginPasscode}
                    onChange={(e) => setLoginPasscode(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Demo passcodes: Elder (1234), Caretaker (5678), Family (9999)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 rounded-xl font-black text-white text-base shadow-sm transition-all ${
                    loading ? "bg-slate-400 cursor-wait" : "bg-sky-600 hover:bg-sky-700"
                  }`}
                >
                  {loading ? "Authenticating..." : "Log In to CareCircle"}
                </button>
              </form>
            )}

            {/* TAB 3: CREATE NEW CIRCLE */}
            {authTab === "create" && (
              <form onSubmit={handleCreateCircle} className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Circle Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Miller Family Circle"
                    value={createCircleName}
                    onChange={(e) => setCreateCircleName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Elder Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Arthur Miller"
                      value={createElderName}
                      onChange={(e) => setCreateElderName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Elder Age
                    </label>
                    <input
                      type="number"
                      required
                      min={50}
                      max={120}
                      value={createElderAge}
                      onChange={(e) => setCreateElderAge(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Elder Email (for reminders)
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="arthur@example.com"
                    value={createElderEmail}
                    onChange={(e) => setCreateElderEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Elder Passcode (min 4 digits)
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="1234"
                    value={createElderPasscode}
                    onChange={(e) => setCreateElderPasscode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase">Your Details (Creator)</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Clara Miller"
                      value={createCreatorName}
                      onChange={(e) => setCreateCreatorName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Your Role
                    </label>
                    <select
                      value={createCreatorRole}
                      onChange={(e) => setCreateCreatorRole(e.target.value as Role)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold bg-white"
                    >
                      <option value="caretaker">Caretaker</option>
                      <option value="family">Family Member</option>
                      <option value="elder">Elder (Self)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Your Email & Passcode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="email"
                      required
                      placeholder="clara@example.com"
                      value={createCreatorEmail}
                      onChange={(e) => setCreateCreatorEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    />
                    <input
                      type="password"
                      required
                      placeholder="Passcode"
                      value={createCreatorPasscode}
                      onChange={(e) => setCreateCreatorPasscode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Emergency Contact Name & Phone
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Clara (+1-555-0199)"
                    value={createEmergencyContact}
                    onChange={(e) => setCreateEmergencyContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 rounded-xl font-black text-white text-sm shadow-sm transition-all ${
                    loading ? "bg-slate-400 cursor-wait" : "bg-sky-600 hover:bg-sky-700"
                  }`}
                >
                  {loading ? "Creating CareCircle..." : "Establish CareCircle"}
                </button>
              </form>
            )}

            {/* TAB 4: JOIN EXISTING CIRCLE */}
            {authTab === "join" && (
              <form onSubmit={handleJoinCircle} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Care Circle ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CC-DEMO"
                    value={joinCircleId}
                    onChange={(e) => setJoinCircleId(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. David"
                      value={joinName}
                      onChange={(e) => setJoinName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Your Role
                    </label>
                    <select
                      value={joinRole}
                      onChange={(e) => setJoinRole(e.target.value as Role)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold bg-white"
                    >
                      <option value="caretaker">Caretaker</option>
                      <option value="family">Family Member</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Email for Notifications
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="david@example.com"
                    value={joinEmail}
                    onChange={(e) => setJoinEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Choose Personal Passcode
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="min 4 digits"
                    value={joinPasscode}
                    onChange={(e) => setJoinPasscode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 rounded-xl font-black text-white text-base shadow-sm transition-all ${
                    loading ? "bg-slate-400 cursor-wait" : "bg-sky-600 hover:bg-sky-700"
                  }`}
                >
                  {loading ? "Joining Circle..." : "Join CareCircle"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 CareCircle. Dedicated to respectful, accessible, and connected elder care.</p>
          <div className="flex items-center space-x-4">
            <span>Google Cloud Run</span>
            <span>•</span>
            <span>Firestore</span>
            <span>•</span>
            <span>Gemini 2.5 Flash</span>
            <span>•</span>
            <span>WCAG Accessible</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
