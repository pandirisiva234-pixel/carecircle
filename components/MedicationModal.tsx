"use client";

import React, { useState, useEffect } from "react";
import { Medication } from "@/lib/types";
import { medicationSchema } from "@/lib/validations";
import { X, Plus, Trash2, Pill } from "lucide-react";

/** Today as YYYY-MM-DD in the user's own (browser) timezone. */
function localDateStr(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface MedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  medicationToEdit?: Medication | null;
  highContrast?: boolean;
}

export function MedicationModal({
  isOpen,
  onClose,
  onSaved,
  medicationToEdit,
  highContrast,
}: MedicationModalProps) {
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [timesPerDay, setTimesPerDay] = useState(1);
  const [scheduleTimes, setScheduleTimes] = useState<string[]>(["08:00"]);
  const [startDate, setStartDate] = useState(localDateStr());
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [instructions, setInstructions] = useState("");
  const [prescribedBy, setPrescribedBy] = useState("");
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (medicationToEdit) {
      setName(medicationToEdit.name);
      setDosage(medicationToEdit.dosage);
      setTimesPerDay(medicationToEdit.timesPerDay);
      setScheduleTimes(medicationToEdit.scheduleTimes);
      setStartDate(medicationToEdit.startDate);
      setEndDate(medicationToEdit.endDate || "");
      setNotes(medicationToEdit.notes || "");
      setInstructions(medicationToEdit.instructions || "");
      setPrescribedBy(medicationToEdit.prescribedBy || "");
      setActive(medicationToEdit.active);
    } else {
      setName("");
      setDosage("");
      setTimesPerDay(1);
      setScheduleTimes(["08:00"]);
      setStartDate(localDateStr());
      setEndDate("");
      setNotes("");
      setInstructions("");
      setPrescribedBy("");
      setActive(true);
    }
    setErrors({});
  }, [medicationToEdit, isOpen]);

  if (!isOpen) return null;

  function handleTimesCountChange(count: number) {
    setTimesPerDay(count);
    const defaults = ["08:00", "13:00", "19:00", "22:00"];
    const newTimes: string[] = [];
    for (let i = 0; i < count; i++) {
      newTimes.push(scheduleTimes[i] || defaults[i] || "08:00");
    }
    setScheduleTimes(newTimes);
  }

  function handleTimeValueChange(index: number, val: string) {
    const updated = [...scheduleTimes];
    updated[index] = val;
    setScheduleTimes(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const payload = {
      name,
      dosage,
      timesPerDay: Number(timesPerDay),
      scheduleTimes,
      startDate,
      endDate: endDate || undefined,
      notes,
      instructions,
      prescribedBy,
      active,
    };

    const parsed = medicationSchema.safeParse(payload);
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
      const url = medicationToEdit
        ? `/api/medications/${medicationToEdit.id}`
        : "/api/medications";
      const method = medicationToEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save medication");
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
      aria-labelledby="medication-modal-title"
    >
      <div
        className={`w-full max-w-lg rounded-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto border shadow-2xl transition-all ${
          highContrast ? "bg-white border-black text-black" : "bg-white border-slate-200"
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h2 id="medication-modal-title" className="text-xl font-black text-slate-900">
                {medicationToEdit ? "Edit Medication" : "Add New Medication"}
              </h2>
              <p className="text-xs text-slate-500">Elder will be notified of any schedule change</p>
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
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Medication Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Metformin, Amlodipine"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:border-sky-500"
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Dosage <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 500mg, 1 tablet"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold"
              />
              {errors.dosage && <p className="text-xs text-red-600 mt-1">{errors.dosage}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Times Per Day
              </label>
              <select
                value={timesPerDay}
                onChange={(e) => handleTimesCountChange(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold bg-white"
              >
                <option value={1}>1 time daily</option>
                <option value={2}>2 times daily</option>
                <option value={3}>3 times daily</option>
                <option value={4}>4 times daily</option>
              </select>
            </div>
          </div>

          {/* Dynamic Schedule Times */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Dose Scheduled Times (HH:MM)
            </label>
            <div className="flex flex-wrap gap-2">
              {scheduleTimes.map((timeStr, idx) => (
                <div key={idx} className="flex items-center space-x-1">
                  <span className="text-xs font-bold text-slate-500">#{idx + 1}:</span>
                  <input
                    type="time"
                    required
                    value={timeStr}
                    onChange={(e) => handleTimeValueChange(idx, e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-mono font-bold"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Notes & Food Instructions
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Take with food. Drink a full glass of water."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Prescribing Doctor / Clinic
            </label>
            <input
              type="text"
              placeholder="e.g. Dr. Evelyn Thorne (Cardiology)"
              value={prescribedBy}
              onChange={(e) => setPrescribedBy(e.target.value)}
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
                  : "bg-sky-600 hover:bg-sky-700"
              } ${loading ? "opacity-75 cursor-wait" : ""}`}
            >
              {loading ? "Saving..." : medicationToEdit ? "Update Medication" : "Save Medication"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
