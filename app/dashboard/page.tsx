"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SessionUser, DoseEvent, Medication, Appointment, ActivityLog } from "@/lib/types";
import { AdherenceSummary } from "@/lib/adherence";
import { Navbar } from "@/components/Navbar";
import { DoseCard } from "@/components/DoseCard";
import { ElderSpeechPlayer } from "@/components/ElderSpeechPlayer";
import { AdherenceChart } from "@/components/AdherenceChart";
import { PrescriptionScanner } from "@/components/PrescriptionScanner";
import { MedicationModal } from "@/components/MedicationModal";
import { AppointmentModal } from "@/components/AppointmentModal";
import { ActivityLogView } from "@/components/ActivityLogView";
import { CronTesterModal } from "@/components/CronTesterModal";
import { TodayProgress } from "@/components/TodayProgress";
import { formatTime12h, formatDatePretty } from "@/lib/utils";
import {
  Calendar,
  Pill,
  Plus,
  Clock,
  Sparkles,
  PhoneCall,
  Bell,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Heart,
  Edit2,
  Trash2,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [elderMode, setElderMode] = useState(false);

  const [doses, setDoses] = useState<DoseEvent[]>([]);
  const [metrics, setMetrics] = useState<AdherenceSummary | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Modals state
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [medToEdit, setMedToEdit] = useState<Medication | null>(null);

  const [isAptModalOpen, setIsAptModalOpen] = useState(false);
  const [aptToEdit, setAptToEdit] = useState<Appointment | null>(null);

  const [activeTab, setActiveTab] = useState<"today" | "medications" | "scan" | "appointments" | "activity">("today");

  // Fetch session user
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/");
          return;
        }
        const data = await res.json();
        setUser(data.user);
        if (data.user.role === "elder") {
          setElderMode(true);
        }
      } catch {
        router.push("/");
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [router]);

  // Load all data
  const loadData = useCallback(async () => {
    try {
      const [dosesRes, medsRes, aptsRes, actsRes] = await Promise.all([
        fetch("/api/doses"),
        fetch("/api/medications"),
        fetch("/api/appointments"),
        fetch("/api/activity"),
      ]);

      if (dosesRes.ok) {
        const dData = await dosesRes.json();
        setDoses(dData.doses || []);
        setMetrics(dData.metrics || null);
      }

      if (medsRes.ok) {
        const mData = await medsRes.json();
        setMedications(mData.medications || []);
      }

      if (aptsRes.ok) {
        const aData = await aptsRes.json();
        setAppointments(aData.appointments || []);
      }

      if (actsRes.ok) {
        const actData = await actsRes.json();
        setActivityLogs(actData.logs || []);
      }
    } catch (err) {
      console.error("Failed loading circle data", err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Update dose status
  async function handleUpdateDoseStatus(doseId: string, status: "taken" | "missed" | "scheduled") {
    try {
      const res = await fetch("/api/doses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doseEventId: doseId, status }),
      });

      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error("Failed updating dose", err);
    }
  }

  // Delete medication
  async function handleDeleteMedication(id: string) {
    if (!confirm("Are you sure you want to remove this medication from the schedule?")) return;
    try {
      const res = await fetch(`/api/medications/${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error("Failed deleting medication", err);
    }
  }

  // Delete appointment
  async function handleDeleteAppointment(id: string) {
    if (!confirm("Cancel this appointment?")) return;
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error("Failed deleting appointment", err);
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 animate-pulse flex items-center justify-center text-white">
            <Heart className="w-6 h-6" />
          </div>
          <p className="text-slate-600 font-bold">Loading CareCircle...</p>
        </div>
      </div>
    );
  }

  // Find recent changes made by non-elder members to highlight for the elder
  const recentElderAlerts = activityLogs
    .filter((log) => log.affectsElder && log.memberRole !== "elder")
    .slice(0, 2);

  return (
    <div
      className={`min-h-screen transition-colors ${
        highContrast ? "high-contrast bg-white text-black" : "bg-slate-50 text-slate-900"
      }`}
    >
      <Navbar
        user={user}
        highContrast={highContrast}
        onToggleHighContrast={() => setHighContrast(!highContrast)}
        elderMode={elderMode}
        onToggleElderMode={() => setElderMode(!elderMode)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Elder Centrality Notification Banner */}
        {recentElderAlerts.length > 0 && (
          <aside
            aria-label="Recent care updates"
            className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              highContrast
                ? "bg-white border-black text-black shadow-[4px_4px_0px_#000000]"
                : "bg-sky-50 border-sky-300 text-sky-950 shadow-sm"
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-sky-600 text-white shrink-0 mt-0.5">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Recent Schedule Update for {user.elderName}
                </h2>
                <p className="text-xs sm:text-sm text-sky-900 mt-0.5">
                  You are at the center of all care decisions. Your family/care team made recent updates:
                </p>
                <div className="mt-2 space-y-1">
                  {recentElderAlerts.map((alert) => (
                    <div key={alert.id} className="text-xs sm:text-sm font-bold flex items-center space-x-1.5">
                      <span>•</span>
                      <span>
                        <strong className="text-sky-950">{alert.memberName}</strong> ({alert.memberRole}): {alert.details}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Today at a glance: greeting, progress ring, next dose & appointment */}
        <TodayProgress
          elderName={user.elderName}
          viewerName={user.name}
          viewerRole={user.role}
          doses={doses}
          appointments={appointments}
          elderMode={elderMode}
          highContrast={highContrast}
        />

        {/* Text-to-Speech Player for Elder Mode */}
        <ElderSpeechPlayer
          elderName={user.elderName}
          doses={doses}
          highContrast={highContrast}
        />

        {/* Navigation Tabs (Standard Mode) */}
        {!elderMode && (
          <nav
            aria-label="Dashboard sections"
            className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto pb-2 scrollbar-none"
          >
            {[
              { id: "today", label: "Today's Schedule & Adherence", icon: <Clock className="w-4 h-4" /> },
              { id: "medications", label: `Medications (${medications.length})`, icon: <Pill className="w-4 h-4" /> },
              { id: "scan", label: "Gemini Prescription Scan", icon: <Sparkles className="w-4 h-4" /> },
              { id: "appointments", label: `Appointments (${appointments.length})`, icon: <Calendar className="w-4 h-4" /> },
              { id: "activity", label: "Activity Audit", icon: <FileText className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                aria-current={activeTab === tab.id ? "page" : undefined}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center space-x-2 whitespace-nowrap transition-all border ${
                  activeTab === tab.id
                    ? highContrast
                      ? "bg-black text-white border-black"
                      : "bg-sky-600 text-white border-sky-600 shadow-sm"
                    : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        )}

        {/* ========================================================= */}
        {/* SECTION 1: TODAY'S DOSES & ADHERENCE                     */}
        {/* ========================================================= */}
        {(elderMode || activeTab === "today") && (
          <div className="space-y-6">
            {/* Adherence Chart & Metrics (Hidden in pure Elder Mode to keep focus clear) */}
            {!elderMode && metrics && (
              <AdherenceChart metrics={metrics} highContrast={highContrast} />
            )}

            {/* Today's Dose Cards Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2
                    className={`font-black text-slate-900 tracking-tight ${
                      elderMode ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
                    }`}
                  >
                    Today&apos;s Medicine Doses
                  </h2>
                  <p className="text-sm font-medium text-slate-600">
                    {formatDatePretty(new Date().toISOString())} • {doses.length} total scheduled
                  </p>
                </div>

                {/* Add medication shortcut for caretaker */}
                {!elderMode && user.role !== "elder" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMedToEdit(null);
                      setIsMedModalOpen(true);
                    }}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold flex items-center space-x-1.5 shadow-sm self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Medication</span>
                  </button>
                )}
              </div>

              {doses.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                  <Pill className="w-10 h-10 mx-auto text-sky-500" aria-hidden="true" />
                  <p className="mt-3 text-lg font-black text-slate-900">No medicines scheduled for today</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {user.role === "elder"
                      ? "Your care team can add medicines, or scan a prescription for you."
                      : "Add a medicine manually or let Gemini read a prescription photo for you."}
                  </p>
                  {user.role !== "elder" && (
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMedToEdit(null);
                          setIsMedModalOpen(true);
                        }}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold inline-flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" /> Add medicine
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setElderMode(false);
                          setActiveTab("scan");
                        }}
                        className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-sm font-bold inline-flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
                      >
                        <Sparkles className="w-4 h-4 text-violet-600" aria-hidden="true" /> Scan a prescription
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {doses.map((dose) => (
                    <DoseCard
                      key={dose.id}
                      dose={dose}
                      userRole={user.role}
                      elderMode={elderMode}
                      highContrast={highContrast}
                      onUpdateStatus={handleUpdateDoseStatus}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Quick Emergency Contact Pill for Elder */}
            {elderMode && (
              <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
                    <PhoneCall className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-amber-800">Emergency & Caretaker Contact</span>
                    <p className="text-lg font-black text-amber-950">Sarah Jenkins: +1 (555) 234-5678</p>
                  </div>
                </div>
                <a
                  href="tel:+15552345678"
                  className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-base shadow-sm"
                >
                  Call Now
                </a>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 2: MEDICATIONS DIRECTORY                          */}
        {/* ========================================================= */}
        {!elderMode && activeTab === "medications" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Medication Plan
                </h2>
                <p className="text-sm text-slate-600">
                  Full list of active prescriptions and dietary directions
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("scan")}
                  className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-sm font-bold flex items-center space-x-1.5 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Scan Prescription Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMedToEdit(null);
                    setIsMedModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold flex items-center space-x-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Medication</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medications.map((med) => (
                <div
                  key={med.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    highContrast
                      ? "bg-white border-black text-black"
                      : "bg-white border-slate-200 shadow-sm hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-black text-slate-900">{med.name}</span>
                        <span className="text-xs font-bold text-sky-800 bg-sky-100 border border-sky-300 px-2 py-0.5 rounded-full">
                          {med.dosage}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold mt-1">
                        {med.timesPerDay}x daily at {med.scheduleTimes.map(formatTime12h).join(", ")}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMedToEdit(med);
                          setIsMedModalOpen(true);
                        }}
                        aria-label={`Edit ${med.name}`}
                        className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMedication(med.id)}
                        aria-label={`Delete ${med.name}`}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {med.notes && (
                    <div className="mt-3 p-2.5 bg-slate-50 rounded-xl text-xs font-medium text-slate-700 border border-slate-100">
                      <strong>Instructions:</strong> {med.notes}
                    </div>
                  )}

                  {med.prescribedBy && (
                    <p className="text-[11px] text-slate-500 font-semibold mt-3">
                      Prescribed by: {med.prescribedBy}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 3: GEMINI PRESCRIPTION SCANNER                   */}
        {/* ========================================================= */}
        {!elderMode && activeTab === "scan" && (
          <div className="space-y-6">
            <PrescriptionScanner
              onMedicationsAdded={() => {
                loadData();
                setActiveTab("medications");
              }}
              highContrast={highContrast}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 4: APPOINTMENTS                                   */}
        {/* ========================================================= */}
        {!elderMode && activeTab === "appointments" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Medical Appointments
                </h2>
                <p className="text-sm text-slate-600">
                  Doctor visits, clinic locations, and 24-hour automated email alerts
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAptToEdit(null);
                  setIsAptModalOpen(true);
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center space-x-1.5 shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule Appointment</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments.length === 0 ? (
                <div className="col-span-2 p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
                  No appointments scheduled.
                </div>
              ) : (
                appointments.map((apt) => {
                  const aptDate = new Date(apt.dateTime);
                  const isUpcoming = aptDate.getTime() > Date.now();

                  return (
                    <div
                      key={apt.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        highContrast
                          ? "bg-white border-black text-black"
                          : "bg-white border-slate-200 shadow-sm hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-black text-slate-900">{apt.doctor}</h3>
                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                              {apt.specialty}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-sky-800 mt-1 flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {aptDate.toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}{" "}
                              at {aptDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              setAptToEdit(apt);
                              setIsAptModalOpen(true);
                            }}
                            aria-label={`Edit appointment with ${apt.doctor}`}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAppointment(apt.id)}
                            aria-label={`Cancel appointment with ${apt.doctor}`}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-slate-600 space-y-1">
                        <p><strong>Location:</strong> {apt.location}</p>
                        {apt.notes && <p><strong>Notes:</strong> {apt.notes}</p>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 5: ACTIVITY LOG & CRON TESTER                     */}
        {/* ========================================================= */}
        {!elderMode && activeTab === "activity" && (
          <div className="space-y-6">
            <ActivityLogView logs={activityLogs} highContrast={highContrast} />
            <CronTesterModal onTriggered={loadData} highContrast={highContrast} />
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-semibold text-slate-600">
          <p>CareCircle · keeping elders at the centre of their own care</p>
          <p>Powered by Google Gemini 2.5 Flash · Google Cloud Firestore · Gmail reminders</p>
        </div>
      </footer>

      {/* Medication Modal */}
      <MedicationModal
        isOpen={isMedModalOpen}
        onClose={() => setIsMedModalOpen(false)}
        onSaved={loadData}
        medicationToEdit={medToEdit}
        highContrast={highContrast}
      />

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={isAptModalOpen}
        onClose={() => setIsAptModalOpen(false)}
        onSaved={loadData}
        appointmentToEdit={aptToEdit}
        highContrast={highContrast}
      />
    </div>
  );
}
