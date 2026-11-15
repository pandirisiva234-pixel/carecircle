"use client";

import React, { useState, useEffect } from "react";
import { DoseEvent } from "@/lib/types";
import { SpeechAnnouncer } from "@/lib/speech";
import { formatTime12h } from "@/lib/utils";
import { Volume2, VolumeX, Pause, Play, Square } from "lucide-react";

interface ElderSpeechPlayerProps {
  elderName: string;
  doses: DoseEvent[];
  highContrast?: boolean;
}

export function ElderSpeechPlayer({ elderName, doses, highContrast }: ElderSpeechPlayerProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechText, setSpeechText] = useState("");
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(SpeechAnnouncer.isSupported());
    return () => {
      SpeechAnnouncer.stop();
    };
  }, []);

  function generateScript(): string {
    if (doses.length === 0) {
      return `Hello ${elderName}. You have no medications scheduled for today. Have a wonderful and restful day!`;
    }

    const takenCount = doses.filter((d) => d.status === "taken").length;
    const pendingCount = doses.filter((d) => d.status === "scheduled").length;

    let text = `Hello ${elderName}. Here is your medication schedule for today. `;
    text += `You have ${doses.length} total doses scheduled. `;
    if (takenCount > 0) {
      text += `You have already taken ${takenCount} of them. Great job! `;
    }
    if (pendingCount > 0) {
      text += `You have ${pendingCount} doses remaining. `;
    }

    text += "Here are the details: ";

    doses.forEach((dose, index) => {
      const timeReadable = formatTime12h(dose.scheduledTimeLocal);
      text += `Dose number ${index + 1}: ${dose.medicationName}, dosage ${dose.dosage}, scheduled for ${timeReadable}. `;
      if (dose.status === "taken") {
        text += `Status: already taken. `;
      } else if (dose.status === "missed") {
        text += `Status: this dose is currently overdue. Please take it safely as soon as possible. `;
      } else {
        text += `Status: scheduled. `;
      }
    });

    text += "Please remember to drink water with your medications and tap the Taken button after you take each dose.";
    return text;
  }

  function handlePlay() {
    if (isPaused) {
      SpeechAnnouncer.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }

    const script = generateScript();
    setSpeechText(script);
    setIsSpeaking(true);
    setIsPaused(false);

    SpeechAnnouncer.speak(script, () => {
      setIsSpeaking(false);
      setIsPaused(false);
    });
  }

  function handlePause() {
    SpeechAnnouncer.pause();
    setIsPaused(true);
    setIsSpeaking(false);
  }

  function handleStop() {
    SpeechAnnouncer.stop();
    setIsSpeaking(false);
    setIsPaused(false);
  }

  if (!supported) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border transition-all ${
        highContrast
          ? "bg-white border-black text-black shadow-[4px_4px_0px_#000000]"
          : "bg-gradient-to-r from-sky-50 via-indigo-50 to-amber-50 border-sky-200 shadow-sm"
      }`}
      role="region"
      aria-label="Voice reading of today's medications"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0 ${
              isSpeaking
                ? "bg-emerald-600 animate-pulse"
                : highContrast
                ? "bg-black text-white"
                : "bg-sky-600"
            }`}
            aria-hidden="true"
          >
            {isSpeaking ? <Volume2 className="w-7 h-7" /> : <Volume2 className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Listen to Today&apos;s Medicines
            </h3>
            <p className="text-sm font-medium text-slate-600">
              {isSpeaking
                ? "Speaking now... Listen carefully or pause at any time."
                : isPaused
                ? "Playback paused. Tap Resume to continue."
                : "Tap below to hear your medication schedule read out loud clearly."}
            </p>
          </div>
        </div>

        {/* Audio Action Buttons */}
        <div className="flex items-center gap-2">
          {!isSpeaking && !isPaused ? (
            <button
              type="button"
              onClick={handlePlay}
              className={`w-full sm:w-auto px-5 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 text-base shadow-sm transition-all ${
                highContrast
                  ? "bg-black text-white hover:bg-slate-900"
                  : "bg-sky-600 hover:bg-sky-700 text-white"
              }`}
              aria-label="Start reading today's medications aloud"
            >
              <Volume2 className="w-5 h-5" />
              <span>Read Medicines Aloud</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {isSpeaking ? (
                <button
                  type="button"
                  onClick={handlePause}
                  className="px-4 py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center space-x-1.5 shadow-sm"
                  aria-label="Pause voice reading"
                >
                  <Pause className="w-5 h-5" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePlay}
                  className="px-4 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 shadow-sm"
                  aria-label="Resume voice reading"
                >
                  <Play className="w-5 h-5" />
                  <span>Resume</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleStop}
                className="px-4 py-2.5 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white flex items-center space-x-1.5 shadow-sm"
                aria-label="Stop voice reading"
              >
                <Square className="w-4 h-4" />
                <span>Stop</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div aria-live="polite" className="sr-only">
        {isSpeaking && speechText}
      </div>
    </div>
  );
}
