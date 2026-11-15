"use client";

// Web Speech API client helper for Elder Mode
export class SpeechAnnouncer {
  private static synth: SpeechSynthesis | null = null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;

  private static getSynth(): SpeechSynthesis | null {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return null;
    }
    return window.speechSynthesis;
  }

  public static isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  public static speak(text: string, onEnd?: () => void): void {
    const synth = this.getSynth();
    if (!synth) {
      console.warn("SpeechSynthesis is not supported in this browser.");
      if (onEnd) onEnd();
      return;
    }

    // Cancel any previous speech immediately
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    // Set voice properties optimized for clarity and elder hearing comfort
    utterance.rate = 0.9; // Slightly slower, calm cadence
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Pick an English voice if available
    const voices = synth.getVoices();
    const naturalVoice = voices.find(
      (v) => (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha")) && v.lang.startsWith("en")
    ) || voices.find((v) => v.lang.startsWith("en"));

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    if (onEnd) {
      utterance.onend = () => {
        onEnd();
      };
      utterance.onerror = () => {
        onEnd();
      };
    }

    synth.speak(utterance);
  }

  public static stop(): void {
    const synth = this.getSynth();
    if (synth) {
      synth.cancel();
    }
  }

  public static pause(): void {
    const synth = this.getSynth();
    if (synth && synth.speaking) {
      synth.pause();
    }
  }

  public static resume(): void {
    const synth = this.getSynth();
    if (synth && synth.paused) {
      synth.resume();
    }
  }
}
