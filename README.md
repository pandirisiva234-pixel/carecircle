# CareCircle — Elderly Care & Medication Management Platform

> **An elder-centered healthcare coordination platform built with Next.js 15, Tailwind CSS, Google Cloud Firestore, Gemini 2.5 Flash AI, and automated 15-minute GitHub Actions reminders.**

Deployable out-of-the-box to **Vercel** with a zero-crash in-memory fallback for judges, plus a production-ready **Dockerfile** for containerized environments.

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
3. **Dual-Phase Escalation Engine**: An automated 15-minute cron job powered by **GitHub Actions** (`.github/workflows/reminders.yml`) sends gentle alerts to the elder first. If a critical dose remains unconfirmed after 30 minutes, it automatically escalates urgent notifications to caretakers and family members.
4. **Adherence Dashboard**: Real-time compliance tracking, 7-day visual adherence charts, and appointment management with 24-hour email reminders.

---

## 🚀 Live Demo Credentials for Judges

Judges can explore CareCircle instantly without any manual configuration or credentials:

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

### 5. Automated Reminders & 15-Minute Escalation Cron
- Protected endpoint: `POST /api/cron/reminders` (authenticated via `x-cron-secret` header).
- Scheduled via **GitHub Actions** (`.github/workflows/reminders.yml`) running every 15 minutes.
- **Three-Tier Notification Logic**:
  1. **Upcoming Doses**: Gentle reminder to elder ~15-30 min before schedule.
  2. **Missed Doses (Elder First)**: Gentle overdue alert sent directly to elder within 0-29 min overdue.
  3. **Family Escalation**: If still missed after $\ge 30$ minutes, urgent escalation emails dispatched to family and caretakers.
  4. **Appointments**: 24-hour advance appointment reminders.
- **In-App Simulator**: Test the cron live directly from the dashboard!

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

## 🏗 Architecture & Cloud Services

```
┌──────────────────────────────────────────────────────────────┐
│                    CareCircle Client (Next.js 15)            │
│       WCAG Accessible UI • High Contrast • Web Speech API    │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTP / JSON
┌──────────────────────────────▼───────────────────────────────┐
│              Vercel Serverless / Docker Standalone            │
│  - Next.js 15 App Router API Routes                          │
│  - Signed Session Cookies & Sliding-Window Rate Limiting     │
│  - Security Headers (HSTS, CSP, X-Frame-Options, Sniffing)   │
└──────┬───────────────────────┬───────────────────────┬───────┘
       │                       │                       │
┌──────▼─────────────┐ ┌───────▼───────────────┐ ┌─────▼────────────────┐
│ Google Cloud       │ │ Google Gemini API     │ │ GitHub Actions       │
│ Firestore          │ │ Model:                │ │ (.github/workflows/  │
│ (firebase-admin)   │ │ gemini-2.5-flash      │ │  reminders.yml)      │
│ In-memory zero-    │ │ Prescription Vision   │ │ Every 15 minutes     │
│ crash fallback     │ │ JSON Extraction       │ │                      │
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
- **Database**: Google Cloud Firestore (`firebase-admin`) with zero-crash in-memory fallback
- **Artificial Intelligence**: Google Gemini API (`@google/genai`, model `gemini-2.5-flash`)
- **Email Engine**: Nodemailer with Gmail SMTP
- **Scheduled Automation**: GitHub Actions workflow cron (`reminders.yml`)
- **Security**: Bcrypt password hashing, HMAC-SHA256 signed cookies, rate limiting
- **Validation**: Zod
- **Icons**: Lucide React
- **Testing**: Vitest unit test suite

---

## ⚡ Deployment to Vercel (Recommended)

CareCircle works on **Vercel** completely out-of-the-box!

### Step 1: Deploy with Vercel Git Integration
1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/new), import your `carecircle` repository.
3. Framework Preset: **Next.js** (automatically detected).
4. Root Directory: `./`

### Step 2: Configure Environment Variables in Vercel
In **Vercel Project Settings → Environment Variables**, add:

| Variable | Description | Example / Note |
| :--- | :--- | :--- |
| `SESSION_SECRET` | 32+ char secret for signed session cookies | `carecircle-secure-secret-key-32-chars` |
| `CRON_SECRET` | Secret token protecting the reminders endpoint | `my-secure-cron-secret-12345` |
| `APP_URL` | Your public Vercel domain URL | `https://your-carecircle.vercel.app` |
| `GEMINI_API_KEY` | Google Gemini API Key | From [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `FIREBASE_PROJECT_ID` | Google Cloud / Firebase Project ID | `your-firebase-project-id` |
| `FIREBASE_CLIENT_EMAIL` | Service Account client email | `firebase-adminsdk@your-project.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | Service Account private key | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n` |
| `GMAIL_USER` | Gmail address for clinical alerts | `your.email@gmail.com` |
| `GMAIL_APP_PASSWORD` | 16-character Gmail App Password | From Google Account Security |

> **Zero-Crash Demo Guarantee for Judges**: If `FIREBASE_*` variables are not yet configured, CareCircle seamlessly falls back to an in-memory store pre-seeded with the demo circle (`CC-DEMO`). The app will **never crash** on Vercel even without external GCP credentials!

### Step 3: Configure GitHub Actions 15-Minute Cron
CareCircle includes [.github/workflows/reminders.yml](file:///.github/workflows/reminders.yml) which triggers every 15 minutes:

1. In your GitHub repository, navigate to **Settings → Secrets and variables → Actions**.
2. Click **New repository secret** and add:
   - `APP_URL`: Your live Vercel app URL (e.g. `https://your-carecircle.vercel.app`).
   - `CRON_SECRET`: Same token set in your Vercel `CRON_SECRET`.
3. The workflow will automatically run every 15 minutes and can also be triggered manually under the **Actions** tab with the **"Run workflow"** button.

---

## 🐳 Optional: Docker & Cloud Run Deployment

CareCircle also includes a production multi-stage `Dockerfile` with `output: "standalone"`:

```bash
# Build Docker image
docker build -t carecircle .

# Run container locally on port 8080
docker run -p 8080:8080 --env-file .env.local carecircle
```

Or deploy to Google Cloud Run:
```bash
gcloud builds submit --tag gcr.io/<PROJECT_ID>/carecircle
gcloud run deploy carecircle --image gcr.io/<PROJECT_ID>/carecircle --platform managed --region us-central1 --allow-unauthenticated
```

---

## 💻 Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Local Environment
```bash
cp .env.example .env.local
```

### 3. Run Development Server
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

## 📄 License

MIT License. Designed with care for elderly autonomy and family peace of mind.
