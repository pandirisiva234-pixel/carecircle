"use client";

import React, { useState } from "react";
import { ExtractedMedication } from "@/lib/types";
import { Sparkles, Upload, FileText, Check, Plus, Trash2, AlertCircle } from "lucide-react";

/** Resizes an image data URL to at most `maxSide` px and re-encodes it as JPEG. */
async function downscaleImage(dataUrl: string, maxSide = 1600): Promise<{ dataUrl: string; mimeType: string }> {
  try {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return { dataUrl, mimeType: dataUrl.slice(5, dataUrl.indexOf(";")) || "image/jpeg" };
    ctx.fillStyle = "#ffffff"; // flatten transparency onto white paper
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { dataUrl: canvas.toDataURL("image/jpeg", 0.85), mimeType: "image/jpeg" };
  } catch {
    return { dataUrl, mimeType: dataUrl.slice(5, dataUrl.indexOf(";")) || "image/jpeg" };
  }
}

interface PrescriptionScannerProps {
  onMedicationsAdded: () => void;
  highContrast?: boolean;
}

export function PrescriptionScanner({ onMedicationsAdded, highContrast }: PrescriptionScannerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [extractedMeds, setExtractedMeds] = useState<ExtractedMedication[]>([]);
  const [showReview, setShowReview] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, or WEBP).");
      return;
    }

    setError(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  // Pre-loaded sample prescription for judges (a clearly labelled demo document in /public)
  async function handleUseSamplePrescription() {
    setError(null);
    try {
      const res = await fetch("/sample-prescription.png");
      const blob = await res.blob();
      const file = new File([blob], "sample-prescription.png", { type: "image/png" });
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } catch {
      setError("Could not load the sample prescription. Please upload a photo instead.");
    }
  }

  async function handleScan() {
    if (!imagePreview) {
      setError("Please select or capture a prescription image first.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Phone photos can be 5–10 MB; shrink before upload for speed and to stay under request limits
      const { dataUrl, mimeType } = await downscaleImage(imagePreview);

      const res = await fetch("/api/prescription/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: dataUrl, mimeType }),
      });

      // The platform can return a plain-text error page (e.g. timeout); never crash on it
      const raw = await res.text();
      let data: { error?: string; medications?: ExtractedMedication[] } = {};
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error("The AI scan took too long. Please try again in a moment.");
      }
      if (!res.ok) {
        throw new Error(data.error || "Failed to scan prescription");
      }

      setExtractedMeds(data.medications || []);
      setShowReview(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleFieldChange(index: number, field: keyof ExtractedMedication, value: any) {
    const updated = [...extractedMeds];
    updated[index] = { ...updated[index], [field]: value };
    setExtractedMeds(updated);
  }

  function handleRemoveMed(index: number) {
    setExtractedMeds(extractedMeds.filter((_, i) => i !== index));
  }

  async function handleConfirmAndSave() {
    if (extractedMeds.length === 0) {
      setError("No medications selected to save.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Save each medication via /api/medications
      for (const med of extractedMeds) {
        const payload = {
          name: med.name,
          dosage: med.dosage,
          timesPerDay: med.timesPerDay || 1,
          scheduleTimes: med.scheduleTimes || ["08:00"],
          startDate: med.startDate || new Date().toLocaleDateString("en-CA"),
          notes: med.notes || "",
          instructions: med.instructions || "",
          prescribedBy: med.prescribedBy || "",
          active: true,
        };

        const res = await fetch("/api/medications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || `Failed saving ${med.name}`);
        }
      }

      setSuccessMsg(`Successfully added ${extractedMeds.length} prescription medications to the circle!`);
      setShowReview(false);
      setImagePreview(null);
      setSelectedFile(null);
      setExtractedMeds([]);
      onMedicationsAdded();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setSaving(false);
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
      aria-label="Gemini AI Prescription Scanner"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Google Gemini 3.8 Flash AI</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Prescription Vision Scanner
          </h3>
          <p className="text-sm text-slate-600 mt-0.5">
            Extract medicine names, dosages, and dosing intervals with multimodal AI
          </p>
        </div>

        <button
          type="button"
          onClick={handleUseSamplePrescription}
          className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-2 rounded-xl transition-colors self-start sm:self-auto"
        >
          📄 Load Sample Prescription (Demo)
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-semibold flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-semibold flex items-center space-x-2">
          <Check className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Upload Box */}
      {!showReview && (
        <div className="mt-5 space-y-4">
          <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
            {imagePreview ? (
              <div className="space-y-4">
                <div className="max-w-md mx-auto max-h-60 overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white p-2">
                  <img
                    src={imagePreview}
                    alt="Prescription preview"
                    className="w-full h-auto object-contain max-h-56 mx-auto rounded"
                  />
                </div>
                <div className="flex justify-center gap-3">
                  <label className="cursor-pointer text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-300">
                    Change Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setSelectedFile(null);
                    }}
                    className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <label className="cursor-pointer font-bold text-indigo-600 hover:text-indigo-700 text-base">
                  <span>Upload a photo of prescription or label</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
                <p className="text-xs text-slate-500 mt-1">
                  Supports PNG, JPEG, WEBP or phone camera capture
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleScan}
            disabled={!imagePreview || loading}
            className={`w-full py-4 rounded-xl font-black text-lg flex items-center justify-center space-x-2 text-white shadow-sm transition-all ${
              !imagePreview || loading
                ? "bg-slate-400 cursor-not-allowed"
                : highContrast
                ? "bg-black hover:bg-slate-900"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span>{loading ? "Analyzing Prescription with Gemini..." : "Extract Medicines with Gemini AI"}</span>
          </button>
        </div>
      )}

      {/* Review & Confirmation Step */}
      {showReview && (
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">
              Extracted {extractedMeds.length} Medicines — Review and Edit Before Saving
            </span>
            <button
              type="button"
              onClick={() => setShowReview(false)}
              className="text-xs text-slate-500 hover:underline"
            >
              Upload another image
            </button>
          </div>

          <div className="space-y-3">
            {extractedMeds.map((med, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Medicine Name
                      </label>
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => handleFieldChange(index, "name", e.target.value)}
                        className="w-full px-3 py-1.5 text-sm font-bold bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Dosage
                      </label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => handleFieldChange(index, "dosage", e.target.value)}
                        className="w-full px-3 py-1.5 text-sm font-bold bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Dose Times (Comma separated HH:MM)
                      </label>
                      <input
                        type="text"
                        value={med.scheduleTimes?.join(", ") || "08:00"}
                        onChange={(e) =>
                          handleFieldChange(
                            index,
                            "scheduleTimes",
                            e.target.value.split(",").map((s) => s.trim())
                          )
                        }
                        className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Instructions / Notes
                      </label>
                      <input
                        type="text"
                        value={med.notes || med.instructions || ""}
                        onChange={(e) => handleFieldChange(index, "notes", e.target.value)}
                        className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMed(index)}
                    aria-label={`Remove ${med.name}`}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleConfirmAndSave}
              disabled={saving}
              className={`flex-1 py-3.5 px-6 rounded-xl font-black text-white text-base flex items-center justify-center space-x-2 shadow-sm ${
                highContrast
                  ? "bg-black hover:bg-slate-900"
                  : "bg-emerald-600 hover:bg-emerald-700"
              } ${saving ? "opacity-75 cursor-wait" : ""}`}
            >
              <Check className="w-5 h-5" />
              <span>{saving ? "Saving to Care Plan..." : "Confirm & Save All Medications"}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowReview(false)}
              className="py-3.5 px-5 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
