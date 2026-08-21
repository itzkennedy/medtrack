# MedTrack Codebase Inventory
> Generated from live source code. Last updated: August 2026.

---

## 1. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, Vite 5, lucide-react icons |
| Backend | Node.js, Express 4, pg (node-postgres) |
| Database | PostgreSQL (hosted on Supabase, connected via direct pg pooler) |
| Auth | Custom JWT (bcryptjs + jsonwebtoken), 7-day token expiry |
| Styling | Plain CSS (index.css design system + Dashboard.css component styles) |
| PWA | Minimal service worker (sw.js) — handles notification clicks only |

---

## 2. Project Structure

```
medtrack/
├── client/                          # Vite + React SPA
│   ├── public/
│   │   ├── sw.js                    # Service worker (notificationclick handler)
│   │   └── favicon.svg
│   ├── src/
│   │   ├── main.jsx                 # React 18 root mount (StrictMode)
│   │   ├── App.jsx                  # Router + AuthProvider + route guards
│   │   ├── index.css                # Design tokens (colors, spacing, shadows, radius) + base styles + toast
│   │   ├── Dashboard.css            # All component styles (~1350 lines)
│   │   ├── api/
│   │   │   └── client.js            # API client (fetch wrapper, token mgmt, client_date/time params)
│   │   ├── assets/
│   │   │   ├── logo.png
│   │   │   ├── logo.svg
│   │   │   └── apin-logo.png
│   │   ├── components/
│   │   │   ├── DoseCard.jsx         # Single dose card (top row, ring, actions, status)
│   │   │   ├── MiniAdherenceRing.jsx # 72px SVG progress ring
│   │   │   ├── AdherenceStat.jsx    # Streak circle display
│   │   │   ├── MedicationForm.jsx   # Add/Edit medication form with day picker
│   │   │   └── MedicationDetailModal.jsx # Read-only medication detail popup
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Auth state, login/register/logout, auto-session restore
│   │   ├── pages/
│   │   │   ├── Login.jsx            # Login form
│   │   │   ├── Register.jsx         # Registration form (patient/caregiver role selector)
│   │   │   ├── PatientDashboard.jsx # Main patient view (513 lines)
│   │   │   └── CaregiverDashboard.jsx # Read-only caregiver view (398 lines)
│   │   └── utils/
│   │       ├── urgency.js           # computeUrgency(), computeLatenessMinutes(), formatScheduledTime()
│   │       ├── alarm.js             # Web Audio API beep synthesizer (880Hz sine, unlock/play/stop)
│   │       ├── useReminders.js      # React hook: schedules setTimeout alarms + Notification API
│   │       └── useCurrentTime.js    # React hook: interval-based Date state (20s default)
│   ├── index.html
│   ├── vite.config.js               # Proxy /api → localhost:3000
│   └── package.json
├── server/
│   ├── src/
│   │   ├── index.js                 # Express app: CORS, JSON parsing, route mounting, health check
│   │   ├── db.js                    # pg Pool (DATABASE_URL, SSL enabled)
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT verify middleware + requireRole() guard
│   │   └── routes/
│   │       ├── auth.js              # Register, login, /me
│   │       ├── medications.js       # CRUD for medications (patient only)
│   │       ├── doses.js             # Today doses, log dose, adherence stats, history
│   │       ├── caregiver.js         # Invite/accept, list patients, list/revoke access
│   │       └── schedules.js         # STUB ONLY — two routes returning 501
│   ├── scripts/
│   │   └── db-init.js               # Reads schema.sql, runs against DATABASE_URL
│   ├── package.json
│   └── .env.example
└── db/
    ├── schema.sql                   # 5 tables
    └── migrations/
        └── 002_caregiver_invite.sql # Adds invite_code column, makes caregiver_id nullable
```

---

## 3. Database Schema (5 tables)

### `user`
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | SERIAL | PRIMARY KEY |
| full_name | VARCHAR(120) | NOT NULL |
| email | VARCHAR(160) | UNIQUE NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| role | VARCHAR(20) | NOT NULL, CHECK ('patient', 'caregiver') |
| created_at | TIMESTAMP | DEFAULT NOW() |

### `caregiver_link`
| Column | Type | Constraints |
|--------|------|-------------|
| link_id | SERIAL | PRIMARY KEY |
| patient_id | INT | NOT NULL, FK → user(user_id) |
| caregiver_id | INT | NULLABLE, FK → user(user_id) |
| status | VARCHAR(20) | DEFAULT 'pending', CHECK ('pending', 'accepted', 'revoked') |
| invite_code | VARCHAR(10) | UNIQUE, nullable |
| created_at | TIMESTAMP | DEFAULT NOW() |

### `medication`
| Column | Type | Constraints |
|--------|------|-------------|
| medication_id | SERIAL | PRIMARY KEY |
| user_id | INT | NOT NULL, FK → user(user_id) |
| name | VARCHAR(120) | NOT NULL |
| dosage | VARCHAR(60) | NOT NULL |
| start_date | DATE | NOT NULL |
| end_date | DATE | NULLABLE |
| created_at | TIMESTAMP | DEFAULT NOW() |

### `schedule`
| Column | Type | Constraints |
|--------|------|-------------|
| schedule_id | SERIAL | PRIMARY KEY |
| medication_id | INT | NOT NULL, FK → medication(medication_id) |
| time_of_day | TIME | NOT NULL |
| days_of_week | VARCHAR(20) | NOT NULL (e.g. "DAILY", "WEEKDAYS", "MON,WED,FRI") |

### `adherence_log`
| Column | Type | Constraints |
|--------|------|-------------|
| log_id | SERIAL | PRIMARY KEY |
| schedule_id | INT | NOT NULL, FK → schedule(schedule_id) |
| status | VARCHAR(20) | NOT NULL, CHECK ('taken', 'skipped', 'snoozed') |
| logged_at | TIMESTAMP | DEFAULT NOW() |

---

## 4. API Endpoints

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | No | Register new user (name, email, password, role). Validates email format, password ≥ 8 chars, duplicate check. |
| POST | `/login` | No | Returns JWT (7d expiry) + user object. |
| GET | `/me` | Yes | Returns current user profile from token. |

### Medications (`/api/medications`)
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/` | Yes | any | List all medications with schedules (grouped by medication). Supports `?patient_id=` for caregiver. |
| POST | `/` | Yes | patient | Create medication + schedule. Requires: name, dosage, start_date, time_of_day, days_of_week. |
| PUT | `/:medication_id` | Yes | patient | Update medication fields + schedule. Ownership verified. |
| DELETE | `/:medication_id` | Yes | patient | Delete medication. Ownership verified. **Note: FK cascade not configured — delete will fail if adherence_log rows exist.** |

### Doses (`/api/doses`)
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/today` | Yes | any | Returns today's active doses with adherence ring data. Accepts `client_date`, `client_time` query params. Caregiver uses `?patient_id=`. Filters by days_of_week and date range. |
| POST | `/:schedule_id/log` | Yes | patient | Log a dose as taken/skipped/snoozed. Creates adherence_log entry. |
| GET | `/adherence` | Yes | any | Returns `{ seven_day, thirty_day, streak }`. 7/30-day are rolling adherence %. Streak counts consecutive all-taken days. |
| GET | `/history` | Yes | any | Returns dose history (default 30 days, max 365). Returns log_id, medication name, dosage, status, scheduled_time, logged_at, date. |

### Caregiver (`/api/caregiver`)
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/invite` | Yes | patient | Generate 8-char hex invite code. |
| POST | `/accept` | Yes | caregiver | Accept invite code. Links caregiver to patient. Prevents self-linking. |
| GET | `/patients` | Yes | caregiver | List linked patients (accepted only). |
| GET | `/access` | Yes | patient | List all caregivers (pending + accepted) with access info. |
| DELETE | `/access/:link_id` | Yes | patient | Revoke caregiver access (sets status='revoked'). |

### Schedules (`/api/schedules`) — **STUB**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Returns 501 Not Implemented |
| POST | `/` | Returns 501 Not Implemented |

### Health Check
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Returns `{ status: "ok", sprint: 0 }` |

---

## 5. Frontend Routes

| Path | Component | Guard | Description |
|------|-----------|-------|-------------|
| `/login` | Login.jsx | GuestRoute (redirects to dashboard if logged in) | Email/password login form |
| `/register` | Register.jsx | GuestRoute | Registration with role selector (patient/caregiver) |
| `/dashboard` | PatientDashboard.jsx | ProtectedRoute (patient only) | Main patient interface |
| `/caregiver` | CaregiverDashboard.jsx | ProtectedRoute (caregiver only) | Read-only caregiver interface |
| `*` | Redirect → `/login` | — | Catch-all |

---

## 6. Features — Working

### Authentication
- Registration with email/password/role (patient or caregiver)
- Login returns JWT, stored in localStorage
- Auto-session restore on page load (AuthContext calls `/auth/me`)
- Protected routes with role-based guards
- Guest routes redirect logged-in users to their dashboard

### Patient Dashboard
- **Today view**: Shows all active doses for the current day (filtered by days_of_week + date range)
- **History view**: Last 30 days of logged doses, grouped by date
- **Medication list**: Shows all medications with edit/delete actions
- **Caregiver access section**: Generate invite code, view linked caregivers, revoke access
- **Notification bar**: Prompts to enable browser notifications
- **Skeleton loading**: Shown during initial data fetch
- **Toast notifications**: Success/error feedback on actions
- **View tabs**: Toggle between Today and History

### Caregiver Dashboard
- **Patient selector**: Dropdown when linked to multiple patients
- **Invite code input**: Link to patient via invite code
- **Today view**: Read-only dose cards (no action buttons)
- **History view**: Read-only dose history
- **READ-ONLY badge** in header
- Handles revoked access gracefully (shows error, clears state)

### Dose Cards (DoseCard.jsx)
- Single top row: medication name + dosage (left), time + urgency badges (right)
- Centered 72px progress ring (MiniAdherenceRing)
- Three action buttons: Taken, Snooze, Skip
- State variants: overdue (red pulse), due-soon (yellow), not-yet (dimmed), taken (green border), skipped (dimmed), snoozed (dimmed)
- Late badge: Shows minutes/hours late when logged > 30 min after scheduled time
- Locked state: Shows "Available at [time]" for not-yet/due-soon doses
- Caregiver mode: `readOnly` prop hides action buttons

### Progress Ring (MiniAdherenceRing.jsx)
- 72px SVG ring, 5px stroke, color-coded: green (≥80%), yellow (≥50%), red (<50%)
- Shows percentage + optional label (days active)
- Progress = doses taken / total scheduled doses in medication period

### Adherence Stats (AdherenceStat.jsx)
- Streak circle with flame icon
- Shows consecutive-day streak count
- 7-day and 30-day adherence percentages (computed server-side)

### Medication Management (MedicationForm.jsx)
- Add new medication with: name, dosage, start date, end date (optional), time of day, days of week
- Day picker: Quick select (Daily/Weekdays) + individual day toggles
- Edit existing medication (pre-fills form)
- Validation: required fields, end date > start date

### Medication Detail Modal (MedicationDetailModal.jsx)
- Read-only popup showing: name, dosage, date range, time of day, days of week
- Triggered by clicking a medication in the list
- Closes on Escape key or overlay click

### Dose Logging
- POST to `/doses/:schedule_id/log` with status (taken/skipped/snoozed)
- Each log creates a new adherence_log row (no duplicate prevention)
- Dashboard refreshes after logging

### Urgency System (urgency.js)
- `computeUrgency()`: Returns "overdue", "due-soon" (within 60 min), or "not-yet"
- `computeLatenessMinutes()`: Minutes between scheduled time and actual log time
- Uses `buildScheduledDate()` with `scheduled_date` from server to avoid timezone issues

### Browser Reminders (useReminders.js + alarm.js)
- Web Audio API synthesized alarm: 880Hz sine wave, 4 beeps per cycle, 50% volume
- Auto-unlock on first user interaction (click/keydown)
- `playAlarm()` attempts audio unlock before playing
- Browser Notification API (requires permission)
- setTimeout-based scheduling: recalculates on focus/visibilitychange
- Auto-stops after 30 seconds
- Service worker handles notification click → focuses window
- Service worker auto-registers when permission is granted or already granted

### Timezone Handling
- Client sends `client_date` and `client_time` query params on /today, /adherence, /history
- Server validates format, falls back to server time
- Adherence log dates are converted to local timezone before comparison (`new Date(rl.logged_at)` + `formatDate()`)

### Adherence Calculation (Per-Medication Ring)
- Denominator: Total scheduled days from `start_date` to `end_date` (or today if no end_date)
- Numerator: Count of those scheduled days where adherence_log has status="taken" (only within medication period up to today)
- Formula: `Math.round((taken / totalPlanned) * 100)`

### Global Adherence (Dashboard Stats)
- 7-day/30-day: Rolling window, counts scheduled occurrences (respects days_of_week, start/end date)
- Today only included if all scheduled times have passed
- Streak: Counts consecutive days where ALL scheduled doses were taken (checks today separately first)

---

## 7. Features — Incomplete or Stubbed

| Feature | Status | Details |
|---------|--------|---------|
| Schedules API | Stubbed | `/api/schedules` GET/POST return 501. Schedules are created/updated through the medications endpoint instead. |
| ON DELETE CASCADE | Missing | Deleting a medication with existing adherence_log rows will fail with FK violation (no cascade configured). |
| Duplicate log prevention | Missing | Users can log the same schedule_id multiple times for the same day — no UNIQUE constraint on (schedule_id, date). |
| Background push notifications | Missing | sw.js has no `push` event handler. Notifications only work while the page is open. |
| Offline support | Missing | No PWA manifest, no workbox precaching. Service worker only handles notification clicks. |
| Medication detail modal adherence | Missing | Modal shows dates/times but does not display the progress ring or adherence %. |
| Caregiver "Your Streak" label | Bug | CaregiverDashboard shows "Your Streak" instead of "[Patient Name]'s Streak". |
| DELETE cascade for medications | Broken | `DELETE /medications/:id` fails if adherence_log rows reference the schedule (FK violation, no CASCADE). |

---

## 8. Known Issues

1. **DELETE medication FK violation**: No `ON DELETE CASCADE` on `adherence_log.schedule_id → schedule.schedule_id` or `schedule.medication_id → medication.medication_id`. Deleting a medication that has logged doses will fail.
2. **Duplicate dose logs**: No unique constraint prevents logging the same dose multiple times per day. Each log creates a new row, inflating the taken count.
3. **Caregiver streak label**: Both dashboards display "Your Streak" — the caregiver view should show the patient's name.
4. **Service worker limited**: Only handles `notificationclick`. No `push` listener, no background notifications.
5. **SVG notification icon**: Some browsers/platforms don't render SVG icons in notifications (PNG preferred).
6. **No `.gitignore` in root**: `server/.env` (containing DB credentials and JWT secret) could be accidentally committed.
7. **Weak JWT secret**: Dev-only secret string, needs strengthening for production.
8. **SSL certificate verification disabled**: `rejectUnauthorized: false` in db.js.
9. **Schedules route stub**: `/api/schedules` returns 501 (schedules are managed through medications routes instead).
10. **React StrictMode double-mount**: In development, effects run twice (e.g., audio unlock listeners registered twice). Harmless but sloppy.

---

## 9. Key Files Reference

| File | Lines | Purpose |
|------|-------|---------|
| `server/src/routes/doses.js` | ~426 | Core dose logic: today, log, adherence, history, timezone handling |
| `server/src/routes/medications.js` | 167 | Medication CRUD |
| `server/src/routes/caregiver.js` | ~130 | Invite/accept/revoke flow |
| `server/src/routes/auth.js` | ~90 | Register/login/me |
| `client/src/pages/PatientDashboard.jsx` | 513 | Main patient UI |
| `client/src/pages/CaregiverDashboard.jsx` | 398 | Caregiver read-only UI |
| `client/src/Dashboard.css` | ~1350 | All component styles |
| `client/src/api/client.js` | ~95 | API wrapper with token + timezone params |
| `client/src/utils/urgency.js` | 56 | Urgency/lateness computation |
| `client/src/utils/alarm.js` | ~90 | Web Audio alarm synthesizer |
| `client/src/utils/useReminders.js` | ~115 | Reminder scheduling hook |
| `db/schema.sql` | 41 | Database schema (5 tables) |

---

## 10. Environment

| Variable | Location | Description |
|----------|----------|-------------|
| DATABASE_URL | server/.env | Supabase PostgreSQL pooler connection string |
| JWT_SECRET | server/.env | JWT signing secret (dev-only string) |
| PORT | server/.env (optional) | Server port, defaults to 3000 |

No Supabase SDK is used. The database is accessed exclusively via direct PostgreSQL connection through the `pg` library.
