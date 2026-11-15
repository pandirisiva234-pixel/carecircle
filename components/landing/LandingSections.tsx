import React from "react";
import { ArrowRight, Calendar, CheckCircle2, Clock, Sparkles, type LucideIcon } from "lucide-react";
import { Role } from "@/lib/types";

// ---------------------------------------------------------------------------
// Content is data, markup is written once: every section below maps over a list.
// ---------------------------------------------------------------------------

const STATS = [
  { k: "3 roles", v: "Elder · Caretaker · Family" },
  { k: "1 tap", v: "to mark a dose taken" },
  { k: "30 min", v: "before family is alerted" },
  { k: "AI scan", v: "prescription → schedule" },
] as const;

interface Feature {
  title: string;
  body: string;
  Icon: LucideIcon;
  tone: string; // tailwind classes for the icon chip
}

const FEATURES: Feature[] = [
  {
    title: "One-Tap Elder View",
    body: "Large buttons, high-contrast mode, and Web Speech API reading today's medicines out loud.",
    Icon: CheckCircle2,
    tone: "bg-sky-100 text-sky-700",
  },
  {
    title: "Gemini 3.8 Flash Vision",
    body: "Snap a photo of any prescription label to extract medicine names, dosages, and timings as structured JSON.",
    Icon: Sparkles,
    tone: "bg-indigo-100 text-indigo-700",
  },
  {
    title: "15-Min Automated Escalation",
    body: "GitHub Actions 15-min cron: reminds the elder first; escalates to family if still missed after 30 minutes.",
    Icon: Clock,
    tone: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "Appointments & Activity Audit",
    body: "Doctor visit tracking with 24-hour advance email reminders and a transparent log of every change.",
    Icon: Calendar,
    tone: "bg-amber-100 text-amber-700",
  },
];

const STEPS = [
  { n: "1", t: "Create a circle", d: "Set up the elder's profile and invite family with a Circle ID and personal passcode." },
  { n: "2", t: "Add or scan medicines", d: "Type them in, or snap the prescription and let Gemini fill the schedule for review." },
  { n: "3", t: "Stay in the loop", d: "The elder taps Taken. If a dose is missed, the elder is reminded first, then family." },
] as const;

interface DemoPersona {
  role: Role;
  name: string;
  passcode: string;
  emoji: string;
  blurb: string;
  styles: { card: string; badge: string; arrow: string };
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    role: "elder",
    name: "Margaret Jenkins (Elder)",
    passcode: "1234",
    emoji: "👵",
    blurb: 'High contrast, voice read-aloud TTS, giant "Taken" buttons',
    styles: {
      card: "border-purple-200 hover:border-purple-400 bg-purple-50/60 hover:bg-purple-50",
      badge: "bg-purple-200 text-purple-900",
      arrow: "text-purple-600",
    },
  },
  {
    role: "caretaker",
    name: "Sarah Jenkins (Caretaker)",
    passcode: "5678",
    emoji: "👩‍⚕️",
    blurb: "Manage medications, scan prescriptions, schedule appointments",
    styles: {
      card: "border-sky-200 hover:border-sky-400 bg-sky-50/60 hover:bg-sky-50",
      badge: "bg-sky-200 text-sky-900",
      arrow: "text-sky-600",
    },
  },
  {
    role: "family",
    name: "David Jenkins (Family)",
    passcode: "9999",
    emoji: "👨‍👩‍👧",
    blurb: "Adherence tracking, receive missed dose escalations",
    styles: {
      card: "border-emerald-200 hover:border-emerald-400 bg-emerald-50/60 hover:bg-emerald-50",
      badge: "bg-emerald-200 text-emerald-900",
      arrow: "text-emerald-600",
    },
  },
];

export function StatStrip() {
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 max-w-2xl">
      {STATS.map((item) => (
        <div key={item.k} className="rounded-2xl bg-white/80 backdrop-blur border border-slate-200 px-3 py-2.5 shadow-sm">
          <dt className="text-lg font-black text-slate-900 leading-tight">{item.k}</dt>
          <dd className="text-[11px] font-semibold text-slate-600 leading-snug">{item.v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function FeatureGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
      {FEATURES.map(({ title, body, Icon, tone }) => (
        <div
          key={title}
          className="p-4 rounded-2xl bg-white/90 backdrop-blur border border-slate-200 shadow-sm space-y-1.5 motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-sky-300"
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${tone}`}>
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">{title}</h3>
          <p className="text-xs text-slate-600 leading-relaxed">{body}</p>
        </div>
      ))}
    </div>
  );
}

export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="rounded-3xl bg-white/80 backdrop-blur border border-slate-200 p-5 shadow-sm">
      <h2 id="how-heading" className="text-xs font-bold uppercase tracking-wider text-sky-700">
        How it works
      </h2>
      <ol className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STEPS.map((step) => (
          <li key={step.n} className="flex gap-3">
            <span className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-sky-600 to-emerald-500 text-white font-black flex items-center justify-center shadow-sm">
              {step.n}
            </span>
            <div>
              <p className="font-extrabold text-slate-900 text-sm">{step.t}</p>
              <p className="text-xs text-slate-600 leading-relaxed mt-0.5">{step.d}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

interface DemoLoginListProps {
  loading: boolean;
  onSelect: (role: Role) => void;
}

/** One-click judge logins, one card per demo persona. */
export function DemoLoginList({ loading, onSelect }: DemoLoginListProps) {
  return (
    <div className="space-y-2.5 pt-2">
      {DEMO_PERSONAS.map((p) => (
        <button
          key={p.role}
          type="button"
          onClick={() => onSelect(p.role)}
          disabled={loading}
          aria-label={`Log in as ${p.name}`}
          className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between text-left transition-all group disabled:opacity-60 disabled:cursor-wait ${p.styles.card}`}
        >
          <div className="flex items-center space-x-3.5">
            <span className="text-3xl" aria-hidden="true">
              {p.emoji}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">{p.name}</h3>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.styles.badge}`}>Passcode: {p.passcode}</span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">{p.blurb}</p>
            </div>
          </div>
          <ArrowRight
            className={`w-5 h-5 shrink-0 motion-safe:group-hover:translate-x-1 motion-safe:transition-transform ${p.styles.arrow}`}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}
