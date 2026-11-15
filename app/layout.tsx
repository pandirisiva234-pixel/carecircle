import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareCircle — Elderly Care & Medication Management Platform",
  description:
    "Empowering elders, caretakers, and families with shared medication schedules, Gemini AI prescription scanning, adherence tracking, and automated escalation reminders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 selection:bg-sky-200">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-sky-700 focus:text-white focus:rounded-md focus:shadow-lg"
        >
          Skip to main content
        </a>
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}
