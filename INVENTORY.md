# MedTrack — Complete Codebase Inventory

> Generated Sprint 5. Factual snapshot of the application as it exists.

---

## 1. Pages / Routes

| Route Path | Page | Access | What's Shown |
|---|---|---|---|
| `/login` | Login | Guest only (redirects to dashboard if logged in) | Email/password form, "Sign In" button, link to register |
| `/register` | Register | Guest only | Full name, email, password, role selector (Patient/Caregiver), "Create Account" button, link to login |
| `/dashboard` | Patient Dashboard | Patient only (caregiver redirected to `/caregiver`) | Two-column grid: left = Today doses + Adherence + My Medications + Invite Caregiver + Linked Caregivers; right sidebar = MedicationForm. Today/History toggle tabs. |
| `/caregiver` | Caregiver Dashboard | Caregiver only (patient redirected to `/dashboard`) | Single-column centered layout. If no patients: invite code input form. If patients linked: patient selector dropdown (if multiple), Today/History toggle tabs, read-only DoseCards, Adherence stats. Header shows READ-ONLY badge. |
| `*` | Catch-all | Any | Redirects to `/login` |

---

## 2. Features Currently Implemented

### Authentication
- Register as patient or caregiver with full name, email, password (min 8 chars), role selector
- Email format validated client-side (HTML5 `type="email"`) and server-side (regex)
- Duplicate email returns 409 "Email already registered"
- Passwords hashed with bcryptjs (salt rounds 10)
- Login returns JWT (7-day expiry) containing `{ user_id, role }`
- JWT stored in localStorage (`medtrack_token`)
- On app mount, token is restored and `GET /api/auth/me` verifies validity
- `ready` state prevents flash of wrong page during auth check
- Logout clears token from state and localStorage
- GuestRoute redirects logged-in users to their role-appropriate dashboard
- ProtectedRoute checks token existence + role match (patient can't access `/caregiver`, caregiver can't access `/dashboard`)

### Medication Management
- Patient can add medications via sidebar form: name, dosage, start date, end date (optional), time of day, days of week (Daily / Mon-Wed-Fri / Tue-Thu-Sat / Weekdays)
- Client-side validation: all required fields checked, end date must be after start date
- Server-side validation: all required fields checked on both POST and PUT
- Edit medication: clicking Edit pre-fills the form, submits to PUT endpoint
- Delete medication: confirms via `window.confirm`, calls DELETE endpoint, shows toast
- Medications displayed in "My Medications" section with name, dosage, schedule info, Edit/Delete buttons
- Empty state: "No medications added yet" message when no medications exist
- One schedule per medication (time_of_day + days_of_week)

### Scheduling
- Each medication has one schedule with `time_of_day` (TIME) and `days_of_week` (VARCHAR — "DAILY", "WEEKDAYS", "MON,WED,FRI", "TUE,THU,SAT")
- Today view filters doses by current day-of-week match against `days_of_week`
- `GET /api/schedules` routes exist as stubs (return 501 "Not implemented")

### Dose Logging
- Three statuses: Taken (green), Skipped (red), Snoozed (amber)
- Patient sees action buttons on unlogged doses, colored status text on logged doses
- Caregiver sees read-only view — never sees action buttons, shows "Not yet logged" or status text
- After logging, toast shows "Dose marked as {status}"
- Overdue indicator: red left border + red tint + "Overdue" label for past-time unlogged doses
- Due-soon indicator: yellow left border + amber tint + "Due soon" label for doses within 60 minutes
- Duplicate logging is allowed (creates additional adherence_log rows; UI shows most recent)

### Adherence Tracking & Statistics
- Three metrics: Last 7 days %, Last 30 days %, Current streak (consecutive all-taken days)
- Calculated server-side by iterating backwards from today
- Streak breaks if any scheduled dose on a day is not "taken"
- Days with no active schedules don't break streak
- AdherenceStat component shows "--" while data is loading
- Stats refresh automatically after logging a dose

### Dose History
- Toggle between Today and History views via tab buttons
- History shows last 30 days of logged doses grouped by date
- Each date group has a formatted header (e.g. "Mon, Aug 11")
- Each entry shows medication name, dosage, scheduled time, status (colored)
- History fetched on-demand when switching to History tab
- Read-only for both patient and caregiver

### Caregiver Features
- Patient generates 8-char hex invite code via "Invite Caregiver" button
- Code displayed in monospace font for easy sharing
- Caregiver enters code on their dashboard to link
- Self-linking prevention (can't link to own patient account)
- Multiple patients supported — dropdown selector shown when caregiver is linked to 2+ patients
- Auto-selects if only one patient
- Linked Caregivers list shows name, email, pending status, Revoke button
- Revoke confirms via `window.confirm`, sets status to "revoked" (soft delete)
- Revoked caregivers blocked server-side (403) from all patient data endpoints
- Caregiver sees patient's doses, adherence, and history — all read-only
- READ-ONLY badge displayed in caregiver header

### Other Features
- Toast notification system: fixed-position bottom-center, auto-dismisses after 2 seconds, success (green) and error (red) variants
- Error banner with Retry button on fetch failures (PatientDashboard)
- Fetch error handling on caregiver revoked access (shows error, clears patient data)
- Loading state: "Loading..." text shown during initial data fetch
- `GET /api/health` endpoint returns `{ status: "ok", sprint: 0 }`

---

## 3. UI / UX & Design

### Overall Layout Structure
- **Patient Dashboard**: Two-column CSS grid (`1fr 320px`) inside a centered container (`max-width: 1100px`). Left column contains all content sections stacked vertically. Right column is a fixed-width sidebar containing the MedicationForm.
- **Caregiver Dashboard**: Single-column centered layout (`max-width: 800px`), all content stacked vertically.
- **Login/Register**: Centered form (`max-width: 400px`, `margin: 4rem auto`), full-width on mobile.

### Header
- Full-width bar with `background: var(--color-primary)` (#2563eb blue), white text
- Left: MedTrack logo image (`logo.png`, 36px height)
- Right: User full name + Logout button (plain text, no background)
- Caregiver header additionally shows a "READ-ONLY" badge (semi-transparent white background, uppercase, small font)

### Color Scheme and Visual Style
- Clean, minimal, professional design using Tailwind-inspired CSS variables
- Primary: `#2563eb` (blue)
- Success: `#16a34a` (green)
- Warning: `#f59e0b` (amber)
- Danger: `#dc2626` (red)
- Background: `#f8fafc` (very light gray)
- Surface/Cards: `#ffffff` (white)
- Text: `#1e293b` (dark slate)
- Muted text: `#64748b` (gray)
- Borders: `#e2e8f0` (light gray)
- Border radius: `8px` on all elements
- System font stack (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, etc.)

### Component Placement (Patient Dashboard)
- **Top**: Tab buttons (Today / History)
- **Below tabs**: Today section with DoseCards, then Adherence section
- **Below adherence**: My Medications section with edit/delete buttons per med
- **Below medications**: Invite Caregiver button + code display + Linked Caregivers list
- **Right sidebar**: MedicationForm (Add/Edit)

### DoseCard Design
- White card with 1px border, 8px radius, horizontal flex layout
- Left side: bold medication name, dosage in muted text, time in small muted text, urgency label if applicable
- Right side: either action buttons (Taken/Skipped/Snooze) or status text
- Action buttons: colored backgrounds (green/red/amber), white text, no border, 8px radius
- Urgency states: overdue adds red left border + light red background; due-soon adds yellow left border + light yellow background
- Caregiver read-only mode: shows "Not yet logged" or status as plain muted text, no buttons

### MedicationForm Design
- White card with border, 8px radius, 1.25rem padding
- Vertical stack with 0.75rem gap between fields
- Title: "Add Medication" or "Edit Medication"
- Fields: text inputs for name/dosage, date inputs for start/end date, time input, dropdown for days
- Submit button: blue background, white text, full width
- Cancel button (edit mode only): white with border, next to submit
- Error messages shown in red above fields

### Adherence Section
- Flexbox row with `gap: 2rem`, wrapping on mobile
- Three stat blocks side by side: "Last 7 days", "Last 30 days", "Current streak"
- Large numbers (`1.75rem`, bold) with small muted labels below
- Shows "--" when data hasn't loaded

### Empty States
- Doses: "No scheduled doses for today." (muted text)
- History: "No logged doses yet." (muted text)
- My Medications: "No medications added yet. Use the form to add your first medication." (muted text)
- Caregiver no patients: Full card with "Link to a Patient" heading, description, and invite code input form
- Adherence with no data: "--" for all three stats

### Toast / Notification System
- Fixed position bottom-center, white text on colored background
- Animates in (slide up + fade in, 0.2s) and out (fade, 0.3s after 1.7s delay)
- Auto-dismisses after 2 seconds
- Used for: dose logged, medication deleted, access revoked, errors

### Mobile Responsiveness
- **768px breakpoint**: Patient dashboard grid collapses from 2 columns to 1 column, padding reduces
- **480px breakpoint**: Header wraps gracefully, dose action buttons shrink, history entries stack vertically, touch targets maintained at minimum 36-44px
- Button min-height: 44px globally (accessibility), 36px on mobile dose actions
- Input min-height: 44px globally
- Note: The `.dose-actions` and `.history-entry` CSS classes are defined in index.css but DoseCard and history entries use inline styles — the media queries targeting these classes may not fully apply without className additions

### Overall Visual Quality
- Clean, minimal, professional — typical of a well-structured student capstone
- Consistent spacing, colors, and border radius throughout
- No custom fonts, icons, or illustrations beyond the logo
- No skeleton loading animations — just "Loading..." text
- Inline styles used extensively (not CSS modules or styled-components)

---

## 4. Key Components

| Component | File | Responsibility |
|---|---|---|
| `App` | `App.jsx` | Root: BrowserRouter → AuthProvider → AppRoutes |
| `ProtectedRoute` | `App.jsx` | Checks token + role, redirects unauthorized users |
| `GuestRoute` | `App.jsx` | Redirects logged-in users away from login/register |
| `AuthProvider` | `AuthContext.jsx` | Auth state management, token persistence, login/register/logout functions |
| `Login` | `Login.jsx` | Email/password login form, error display, redirect by role |
| `Register` | `Register.jsx` | Registration form with role selector, auto-login after register |
| `PatientDashboard` | `PatientDashboard.jsx` | Main patient view: doses, adherence, medications, history, invite, caregivers, toast |
| `CaregiverDashboard` | `CaregiverDashboard.jsx` | Caregiver view: patient selector, read-only doses/adherence/history, invite accept |
| `DoseCard` | `DoseCard.jsx` | Single dose display: medication info, action buttons or status text, urgency indicators |
| `MedicationForm` | `MedicationForm.jsx` | Add/Edit medication form with validation, pre-fill for edit mode |
| `AdherenceStat` | `AdherenceStat.jsx` | Three-stat display (7-day, 30-day, streak) with "--" fallback |

---

## 5. Current Limitations / Missing Things

### Database
- **Migration 003 (`cascade_delete.sql`) was never created as a file** — the SQL was provided as text to run manually in Supabase. If it hasn't been applied there, deleting a medication will fail with a foreign key constraint error (500).
- No `ON DELETE CASCADE` in the schema file itself — depends on manual migration.

### Schedules
- `GET /api/schedules` and `POST /api/schedules` are stub routes returning 501. Schedules are only created implicitly through medication creation.
- Only one schedule per medication is supported (one time_of_day, one days_of_week pattern).
- No support for multiple doses per day of the same medication at different times.

### Missing Error Handling
- `computeUrgency` is duplicated identically in both dashboards (not extracted to a shared utility).
- The `.dose-actions` and `.history-entry` CSS classes defined in `index.css` for mobile responsiveness are not applied as classNames in the actual JSX — the responsive media queries targeting them won't take effect.
- No global error boundary for uncaught React errors.
- Network failures produce generic error messages with no offline detection.

### Missing UI Polish
- No skeleton/pulse loading animations — just plain "Loading..." text.
- No confirmation or visual feedback when clicking "Invite Caregiver" before the code appears.
- No copy-to-clipboard button for the invite code.
- No pagination or "load more" for history (limited to 30 days, all shown at once).
- No visual indicator of which day's doses are being viewed (no date display in Today view).

### Missing Features (by design for capstone scope)
- No push notifications or SMS reminders.
- No password reset / forgot password flow.
- No email verification.
- No medication reminders or alarms.
- No data export.
- No user profile editing.
- No dark mode.
- No custom medication schedule builder (e.g. "every 3 days").
- No adherence charts or graphs.
- No caregiver notes or messaging.
- No medication photo upload.
- No audit log of who changed what.
- No rate limiting on API endpoints.
- No invite code expiry mechanism.
- No limit on number of pending invites or linked patients.
- No timezone handling — all dates/times use server or client local time.

---

## 6. API Endpoint Reference

| Method | Path | Auth | Role | Body | Response |
|---|---|---|---|---|---|
| GET | `/api/health` | No | — | — | `{ status: "ok", sprint: 0 }` |
| POST | `/api/auth/register` | No | — | `{ full_name, email, password, role }` | 201 `{ user_id, full_name, email, role }` |
| POST | `/api/auth/login` | No | — | `{ email, password }` | `{ token, user }` |
| GET | `/api/auth/me` | Yes | Any | — | `{ user_id, full_name, email, role }` |
| GET | `/api/medications/` | Yes | Any | — | `[{ medication_id, name, dosage, ...schedules }]` |
| POST | `/api/medications/` | Yes | patient | `{ name, dosage, start_date, end_date, time_of_day, days_of_week }` | 201 medication object |
| PUT | `/api/medications/:id` | Yes | patient | Same as POST | Updated medication object |
| DELETE | `/api/medications/:id` | Yes | patient | — | `{ success: true }` |
| GET | `/api/doses/today` | Yes | Any | `?patient_id=` (caregiver) | `[{ schedule_id, medication_name, dosage, time_of_day, status, ... }]` |
| POST | `/api/doses/:schedule_id/log` | Yes | patient | `{ status }` | 201 `{ log_id, schedule_id, status }` |
| GET | `/api/doses/adherence` | Yes | Any | `?patient_id=` (caregiver) | `{ seven_day, thirty_day, streak }` |
| GET | `/api/doses/history` | Yes | Any | `?days=&patient_id=` | `[{ log_id, medication_name, dosage, status, scheduled_time, date, ... }]` |
| POST | `/api/caregiver/invite` | Yes | patient | — | `{ invite_code }` |
| POST | `/api/caregiver/accept` | Yes | caregiver | `{ invite_code }` | `{ patient_id, full_name }` |
| GET | `/api/caregiver/patients` | Yes | caregiver | — | `[{ user_id, full_name }]` |
| GET | `/api/caregiver/access` | Yes | patient | — | `[{ link_id, full_name, email, status, invite_code, created_at }]` |
| DELETE | `/api/caregiver/access/:link_id` | Yes | patient | — | `{ success: true }` |

---

## 7. Database Schema

### Tables

**`"user"`**
| Column | Type | Constraints |
|---|---|---|
| `user_id` | SERIAL | PRIMARY KEY |
| `full_name` | VARCHAR(120) | NOT NULL |
| `email` | VARCHAR(160) | UNIQUE, NOT NULL |
| `password_hash` | VARCHAR(255) | NOT NULL |
| `role` | VARCHAR(20) | NOT NULL, CHECK IN ('patient', 'caregiver') |
| `created_at` | TIMESTAMP | DEFAULT NOW() |

**`caregiver_link`**
| Column | Type | Constraints |
|---|---|---|
| `link_id` | SERIAL | PRIMARY KEY |
| `patient_id` | INT | NOT NULL, REFERENCES "user"(user_id) |
| `caregiver_id` | INT | REFERENCES "user"(user_id) (nullable) |
| `status` | VARCHAR(20) | DEFAULT 'pending', CHECK IN ('pending', 'accepted', 'revoked') |
| `invite_code` | VARCHAR(10) | UNIQUE |
| `created_at` | TIMESTAMP | DEFAULT NOW() |

**`medication`**
| Column | Type | Constraints |
|---|---|---|
| `medication_id` | SERIAL | PRIMARY KEY |
| `user_id` | INT | NOT NULL, REFERENCES "user"(user_id) |
| `name` | VARCHAR(120) | NOT NULL |
| `dosage` | VARCHAR(60) | NOT NULL |
| `start_date` | DATE | NOT NULL |
| `end_date` | DATE | (nullable) |
| `created_at` | TIMESTAMP | DEFAULT NOW() |

**`schedule`**
| Column | Type | Constraints |
|---|---|---|
| `schedule_id` | SERIAL | PRIMARY KEY |
| `medication_id` | INT | NOT NULL, REFERENCES medication(medication_id) |
| `time_of_day` | TIME | NOT NULL |
| `days_of_week` | VARCHAR(20) | NOT NULL |

**`adherence_log`**
| Column | Type | Constraints |
|---|---|---|
| `log_id` | SERIAL | PRIMARY KEY |
| `schedule_id` | INT | NOT NULL, REFERENCES schedule(schedule_id) |
| `status` | VARCHAR(20) | NOT NULL, CHECK IN ('taken', 'skipped', 'snoozed') |
| `logged_at` | TIMESTAMP | DEFAULT NOW() |

### Migrations
- `002_caregiver_invite.sql` — Makes `caregiver_id` nullable, adds `invite_code` column
- `003_cascade_delete.sql` — **File not created.** SQL provided as text only. Adds `ON DELETE CASCADE` to foreign keys.

---

## 8. Tech Stack

### Client
- React 18.3.1
- React Router DOM 6.23.1
- Vite 5.4.11
- No CSS framework (custom CSS variables + inline styles)

### Server
- Node.js + Express 4.21.0
- PostgreSQL via `pg` 8.23.0 (Supabase)
- bcryptjs 3.0.3 (password hashing)
- jsonwebtoken 9.0.3 (JWT auth)
- cors 2.8.5
- dotenv 16.4.5

### Database
- Supabase Postgres
- 5 tables: `user`, `caregiver_link`, `medication`, `schedule`, `adherence_log`

### Repository
- GitHub: `https://github.com/itzkenny/medtrack.git`
- Branch: `main`
- Root: `medtrack/` (nested under `MEDTRACK/`)
