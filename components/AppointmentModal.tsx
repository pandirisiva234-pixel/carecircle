"use client";

import React, { useState, useEffect } from "react";
import { Appointment } from "@/lib/types";
import { appointmentSchema } from "@/lib/validations";
import { X, Calendar, MapPin, Stethoscope } from "lucide-react";

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  appointmentToEdit?: Appointment | null;
  highContrast?: boolean;
}

export function AppointmentModal({
  isOpen,
  onClose,
  onSaved,
  appointmentToEdit,
  highContrast,
}: AppointmentModalProps) {
  const [doctor, setDoctor] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (appointmentToEdit) {
      setDoctor(appointmentToEdit.doctor);
      setSpecialty(appointmentToEdit.specialty);
      // Format for datetime-local input
      const dt = new Date(appointmentToEdit.dateTime);
      const formatted = !isNaN(dt.getTime())
        ? dt.toISOString().slice(0, 16)
        : appointmentToEdit.dateTime;
      setDateTime(formatted);
      setLocation(appointmentToEdit.location);
      setNotes(appointmentToEdit.notes || "");
    } else {
      setDoctor("");
      setSpecialty("");
      // Default to tomorrow at 10:00 AM
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      tmrw.setHours(10, 0, 0, 0);
      setDateTime(tmrw.toISOString().slice(0, 16));
      setLocation("");
      setNotes("");
    }
    setErrors({});
  }, [appointmentToEdit, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const payload = {
      doctor,
      specialty,
      dateTime,
      location,
      notes,
    };

    const parsed = appointmentSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        const fieldName = err.path[0]?.toString() || "form";
        fieldErrors[fieldName] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const url = appointmentToEdit
        ? `/api/appointments/${appointmentToEdit.id}`
        : "/api/appointments";
      const method = appointmentToEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save appointment");
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="appointment-modal-title"
    >
      <div
        className={`w-full max-w-lg rounded-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto border shadow-2xl transition-all ${
          highContrast ? "bg-white border-black text-black" : "bg-white border-slate-200"
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 id="appointment-modal-title" className="text-xl font-black text-slate-900">
                {appointmentToEdit ? "Edit Appointment" : "Schedule Medical Appointment"}
              </h2>
              <p className="text-xs text-slate-500">24-hour reminder will be emailed automatically</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errors.form && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Doctor / Provider Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Evelyn Thorne"
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold"
              />
              {errors.doctor && <p className="text-xs text-red-600 mt-1">{errors.doctor}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Specialty / Department <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cardiology, Optometry"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold"
              />
              {errors.specialty && <p className="text-xs text-red-600 mt-1">{errors.specialty}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold"
            />
            {errors.dateTime && <p className="text-xs text-red-600 mt-1">{errors.dateTime}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Location / Clinic Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Heart & Vascular Center, Suite 402, St. Jude Pavilion"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold"
            />
            {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Notes & Preparation Instructions
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Bring recent blood pressure logs. Fasting required."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium"
            />
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 rounded-xl font-bold text-white text-sm shadow-sm ${
                highContrast
                  ? "bg-black hover:bg-slate-900"
                  : "bg-indigo-600 hover:bg-indigo-700"
              } ${loading ? "opacity-75 cursor-wait" : ""}`}
            >
              {loading ? "Saving..." : appointmentToEdit ? "Update Appointment" : "Save Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
