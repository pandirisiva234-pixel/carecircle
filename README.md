# CareCircle — Elderly Care & Medication Management Platform

> **An elder-centered healthcare coordination platform built with Next.js 15, Tailwind CSS, Google Cloud Firestore, Gemini 2.5 Flash AI, and Google Cloud Scheduler.**

---

## 📌 Problem

- **The Polypharmacy Challenge**: Elderly adults frequently manage 4 to 8+ daily prescriptions with varied timings, dietary constraints, and specific instructions.
- **Dose Non-Adherence & Adverse Reactions**: Missed doses or accidental double-dosing lead to avoidable hospitalizations and emergency visits.
- **Disempowerment of the Elder**: Many care apps treat seniors as passive subjects rather than active participants in their own health choices.
- **Caregiver Burnout & Fragmentation**: Caretakers and distant family members often have no real-time visibility into whether daily medicines were taken, leading to anxious phone calls or delayed intervention during emergencies.
- **Complex Prescriptions**: Transcribing handwritten prescriptions and pharmacy bottle labels manually is error-prone and time-consuming.

---

## 💡 Solution

**CareCircle** unifies the elder, their primary caretaker, and extended family members into a secure, synchronized care circle:

1. **Elder at the Centre**: The elder interacts with a high-contrast, large-button interface, receives audible voice announcements via the **Web Speech API**, and is immediately notified whenever anyone updates their schedule.
2. **Gemini 2.5 Flash Prescription Scanner**: Upload a picture of a paper prescription or medicine box. Multimodal AI extracts medication names, dosages, and daily timings into structured JSON, which users review and confirm before saving.
3. **Dual-Phase Escalation Engine**: An automated 15-minute cron job powered by **Google Cloud Scheduler** sends gentle alerts to the elder first. If a critical dose remains unconfirmed after 30 minutes, it automatically escalates urgent notifications to caretakers and family members.
4. **Adherence Dashboard**: Real-time compliance tracking, 7-day visual adherence charts, and appointment management with 24-hour email reminders.

---

## 🚀 Live Demo Credentials for Judges

Judges can explore CareCircle instantly without any manual configuration:

- **Demo Circle ID**: `CC-DEMO`
- **👵 Elder Account**: Margaret Jenkins (Age 78) — Passcode: `1234`
  - *Experience the large high-contrast buttons, voice read-aloud TTS, and 1-tap "TAKEN" logging.*
- **👩‍⚕️ Caretaker Account**: Sarah Jenkins (Daughter) — Passcode: `5678`
  - *Manage medications, run Gemini AI prescription scans, schedule doctor visits.*
- **👨‍👩‍👧 Family Account**: David Jenkins (Son) — Passcode: `9999`
  - *Monitor adherence trends, review the activity audit trail, and receive escalation alerts.*

*(Quick 1-click login buttons are also available directly on the homepage!)*

---

## 🌟 Key Features

### 1. Care Circle & Role-Based Access
- Role-based permissions: `elder`, `caretaker`, and `family`.
- Member passcodes securely hashed using **bcrypt**.
- Tamper-proof, signed **httpOnly cookies** for session persistence.
- Sliding-window in-memory **rate limiting** on authentication endpoints.
- Full immutable **Activity Audit Log** capturing who changed what and when.

### 2. Medication Management & Strict Validation
- Create, edit, and delete medications with dosages, start/end dates, directions, and prescribing doctors.
- Dynamic daily schedules (1 to 4 times per day with precise 24h timestamps).
- **Zod schemas** enforce strict validation on all client and API inputs.

### 3. Real-Time Adherence Tracking
- Per-dose status tracking: `scheduled`, `taken`, and `missed`.
- Interactive **7-Day Visual Adherence Chart** with performance ratings.
- Real-time compliance percentage calculations based on scheduled vs. recorded doses.

### 4. Medical Appointments
- Track provider visits with specialty, clinic location, and preparation notes.
- Automated **24-hour advance email reminders** sent to all circle members.

### 5. Automated Reminders & Cloud Scheduler Cron
- Protected endpoint: `POST /api/cron/reminders` (authenticated via `CRON_SECRET` header).
- Designed for **Google Cloud Scheduler** to trigger every 15 minutes.
- **Three-Tier Notification Logic**:
  1. Upcoming dose reminders (sent to elder ~15-30 min before schedule).
  2. Missed dose gentle alert (sent directly to elder within 0-29 min overdue).
  3. Escalated alert (sent to family and caretakers if overdue by $\ge 30$ minutes).
  4. 24-hour appointment reminders.

### 6. Gemini 2.5 Flash Prescription Scanner
- Multimodal OCR via `@google/genai` utilizing the `gemini-2.5-flash` model.
- Converts prescription images into validated clinical JSON arrays.
- Interactive user review modal allowing edits before committing to the care plan.
- Includes sample prescription demo loader for rapid judge evaluation.

### 7. Elder Mode & Accessibility (WCAG Compliant)
- **Extra-large typography** (`text-elder-xl`) and simplified card layouts.
- **High-contrast toggle** meeting WCAG contrast ratio standards.
- **Web Speech API Text-to-Speech (TTS)**: Plays audio summaries of today's medications with Play, Pause, Resume, and Stop controls.
- **Elder Centrality**: Alerts the elder whenever caretakers or family modify care plans.
- One-tap emergency contact calling button.

---

## 🏗 Architecture & Google Cloud Services

```
┌──────────────────────────────────────────────────────────────┐
│                    CareCircle Client (Next.js 15)            │
│       WCAG Accessible UI • High Contrast • Web Speech API    │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTP / JSON
┌──────────────────────────────▼───────────────────────────────┐
│              Google Cloud Run (Next.js Standalone)            │
│  - App Router API Routes                                     │
│  - Signed Session Cookies & Sliding-Window Rate Limiting     │
│  - Security Headers (HSTS, CSP, X-Frame-Options, Sniffing)   │
└──────┬───────────────────────┬───────────────────────┬───────┘
       │                       │                       │
┌──────▼─────────────┐ ┌───────▼───────────────┐ ┌─────▼────────────────┐
│ Google Cloud       │ │ Google Gemini API     │ │ Google Cloud         │
│ Firestore          │ │ Model:                │ │ Scheduler            │
│ (firebase-admin)   │ │ gemini-2.5-flash      │ │ (15-min recurring    │
│ Dual-mode local    │ │ Prescription Vision   │ │ HTTP cron trigger)   │
│ fallback store     │ │ JSON Extraction       │ │                      │
└────────────────────┘ └───────────────────────┘ └─────┬────────────────┘
                                                       │
                                               ┌───────▼────────────────┐
                                               │ Gmail SMTP             │
                                               │ (Nodemailer)           │
                                               │ Alerts & Escalations   │
                                               └────────────────────────┘
```

---

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript, React 19)
- **Styling**: Tailwind CSS with custom elder accessibility tokens
- **Database**: Google Cloud Firestore (`firebase-admin`) with automatic local fallback
- **Artificial Intelligence**: Google Gemini API (`@google/genai`, model `gemini-2.5-flash`)
- **Email Engine**: Nodemailer with Gmail SMTP
- **Security**: Bcrypt password hashing, HMAC-SHA256 signed cookies, rate limiting
- **Validation**: Zod
- **Icons**: Lucide React
- **Testing**: Vitest unit test suite

---

## ⚙️ Setup & Local Development

### 1. Prerequisites
- Node.js 20+ or 24+
- npm 10+

### 2. Clone Repository
```bash
git clone https://github.com/your-username/carecircle.git
cd carecircle
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your credentials in `.env.local`:
```env
SESSION_SECRET="carecircle-secure-random-32-byte-secret-key-change-me"
CRON_SECRET="carecircle-cron-secret-change-me"

# Google Gemini API
GEMINI_API_KEY="your-google-gemini-api-key"

# Google Cloud Firestore (Option A: ADC on Cloud Run; Option B: Service Account)
FIREBASE_PROJECT_ID="your-gcp-project-id"

# Gmail SMTP for Alerts
GMAIL_USER="carecircle.alerts@gmail.com"
GMAIL_APP_PASSWORD="your-16-char-gmail-app-password"
```

*(Note: If Firestore or Gemini API keys are omitted in development or test environments, CareCircle gracefully uses the pre-seeded local JSON store and smart parser so judges can run the entire platform out of the box with zero external configuration!)*

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Unit Tests

Run the Vitest test suite covering scheduling, adherence calculations, and reminder escalation logic:

```bash
npm run test
```

Expected output:
```
 ✓ tests/adherence.test.ts (9 tests)
 Test Files  1 passed (1)
      Tests  9 passed (9)
```

---

## ☁️ Google Cloud Run Deployment

CareCircle includes a production-ready multi-stage `Dockerfile` with `output: "standalone"` enabled.

### 1. Build and Submit Container Image
```bash
gcloud builds submit --tag gcr.io/<PROJECT_ID>/carecircle
```

### 2. Deploy to Cloud Run
```bash
gcloud run deploy carecircle \
  --image gcr.io/<PROJECT_ID>/carecircle \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars FIREBASE_PROJECT_ID="<PROJECT_ID>",CRON_SECRET="<SECRET>",GEMINI_API_KEY="<KEY>"
```

### 3. Configure Google Cloud Scheduler (15-min Cron)
```bash
gcloud scheduler jobs create http carecircle-15min-reminders \
  --schedule="*/15 * * * *" \
  --uri="https://<YOUR-CLOUD-RUN-URL>/api/cron/reminders" \
  --http-method=POST \
  --headers="x-cron-secret=<CRON_SECRET>" \
  --time-zone="America/New_York"
```

---

## 📄 License

MIT License. Designed with care for elderly autonomy and family peace of mind.
