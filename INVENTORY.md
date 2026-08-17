# MedTrack — Complete Codebase Inventory

> Updated Sprint 5 (post-redesign). Factual snapshot of the application as it exists.

---

## 1. Pages / Routes

| Route Path | Page | Access | What's Shown |
|---|---|---|---|
| `/login` | Login | Guest only (redirects to dashboard if logged in) | Email/password form, "Sign In" button, link to register |
| `/register` | Register | Guest only | Full name, email, password, role selector (Patient/Caregiver), "Create Account" button, link to login |
| `/dashboard` | Patient Dashboard | Patient only (caregiver redirected to `/caregiver`) | Two-column grid: left = Today/History tabs → DoseCards + Adherence ring + My Medications + Caregiver Access (invite code + linked list); right sidebar = Add/Edit Medication form only. |
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
- Empty state: "No medications added yet" message with icon when no medications exist
- One schedule per medication (time_of_day + days_of_week)

### Scheduling
- Each medication has one schedule with `time_of_day` (TIME) and `days_of_week` (VARCHAR — "DAILY", "WEEKDAYS", "MON,WED,FRI", "TUE,THU,SAT")
- Today view filters doses by current day-of-week match against `days_of_week`
- `GET /api/schedules` routes exist as stubs (return 501 "Not implemented")

### Dose Logging
- Three statuses: Taken (green filled badge), Skipped (red filled badge), Snoozed (amber filled badge)
- Patient sees action buttons on unlogged doses: "Taken" (primary, filled green), "Snooze" (secondary, outlined amber), "Skip" (secondary, outlined red)
- Caregiver sees read-only view — never sees action buttons, shows "Pending" or status badge
- After logging, toast shows "Dose marked as {status}"
- Overdue indicator: red left border + red gradient background + pulsing dot + filled red "OVERDUE" badge + red time badge
- Due-soon indicator: amber left border + yellow gradient background + amber "DUE SOON" badge
- Pending cards: blue left border + subtle blue gradient background
- Taken cards: green left border + subtle green gradient
- Skipped/Snoozed cards: colored left border + opacity reduction
- Duplicate logging is allowed (creates additional adherence_log rows; UI shows most recent)

### Adherence Tracking & Statistics
- Three metrics: Last 7 days % (SVG circular progress ring), Last 30 days %, Current streak (fire icon)
- Calculated server-side by iterating backwards from today
- Streak breaks if any scheduled dose on a day is not "taken"
- Days with no active schedules don't break streak
- Progress ring color changes: red (<50%), amber (50-79%), green (80%+)
- Stats refresh automatically after logging a dose

### Dose History
- Toggle between Today and History views via tab buttons
- History shows last 30 days of logged doses grouped by date
- Each date group has a formatted header (e.g. "Mon, Aug 11")
- Each entry shows medication name, dosage, scheduled time, status (filled badge)
- History fetched on-demand when switching to History tab
- Read-only for both patient and caregiver

### Caregiver Features
- Patient generates 8-char hex invite code via "Invite Caregiver" button
- Code displayed in monospace font in a styled code box
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
- Toast notification system: fixed-position bottom-center, white text on colored background, animates in/out, auto-dismisses after 2 seconds
- Error banner with Retry button on fetch failures (PatientDashboard)
- Fetch error handling on caregiver revoked access (shows error, clears patient data)
- Loading state: "Loading..." text shown during initial data fetch
- `GET /api/health` endpoint returns `{ status: "ok", sprint: 0 }`

---

## 3. UI / UX & Design

### Design System
- All styles defined in CSS files with CSS custom properties (variables)
- `index.css`: Global reset, design tokens (colors, shadows, spacing, radius), button/input globals, toast animation
- `Dashboard.css`: All dashboard component styles with BEM naming convention
- Zero inline styles across all dashboard components — everything uses CSS classes
- Shadows: xs, sm, md, lg, card (5 levels)
- Spacing: xs (0.25rem), sm (0.5rem), md (0.75rem), lg (1rem), xl (1.5rem), 2xl (2rem)
- Border radius: sm (6px), default (10px), lg (14px), full (9999px)

### Overall Layout Structure
- **Patient Dashboard**: Two-column CSS grid (`1fr 340px`) inside a centered container (`max-width: 1140px`). Left column = `dashboard-main` (all content sections). Right column = `dashboard-sidebar` (MedicationForm only, sticky at top: 80px).
- **Caregiver Dashboard**: Single-column centered layout (`max-width: 800px`), all content stacked vertically.
- **Login/Register**: Centered form (`max-width: 400px`, `margin: 4rem auto`), full-width on mobile.

### Header
- Sticky header (`position: sticky, top: 0, z-index: 100`) with white background and subtle bottom border
- Left: MedTrack logo image (`logo.png`, 32px height)
- Right: User full name (muted text) + Logout button (plain text, hover turns red)
- Caregiver header additionally shows a "READ-ONLY" badge (light blue background, blue text, uppercase, small font, pill shape)

### Color Scheme and Visual Style
- Clean, calm, trustworthy design using CSS custom properties
- Primary: `#2563eb` (blue)
- Success: `#16a34a` (green)
- Warning: `#f59e0b` (amber)
- Danger: `#dc2626` (red)
- Background: `#f1f5f9` (light gray-blue)
- Surface/Cards: `#ffffff` (white)
- Text: `#0f172a` (dark)
- Secondary text: `#334155`
- Muted text: `#64748b` (gray)
- Borders: `#e2e8f0` (light gray)
- System font stack (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, etc.)

### Component Placement (Patient Dashboard)
- **Left column (main)**:
  - Error banner (if fetch fails)
  - View tabs (Today / History) — pill-style toggle in a white container
  - Today view: Section header ("Today's Doses" + count) → DoseCards → Section header ("Adherence") → AdherenceStat
  - History view: Section header ("Dose History" + "Last 30 days") → grouped history entries
  - "My Medications" section with count badge, med list items with Edit/Delete
  - "Caregiver Access" section with Invite button, code box, Linked Caregivers list
- **Right column (sidebar)**:
  - MedicationForm (Add/Edit) — sticky positioned

### DoseCard Design
- White card with 1px border, 14px radius, generous padding (1rem 1.5rem)
- **4px colored left border** as primary state indicator:
  - Pending: blue (`var(--color-primary)`)
  - Overdue: red (`var(--color-danger)`)
  - Due-soon: amber (`var(--color-warning)`)
  - Taken: green (`var(--color-success)`)
  - Skipped/Snoozed: respective color + opacity reduction
- **Gradient backgrounds** per state (subtle, fades to white)
- **Name**: `1.125rem`, bold (700), tight letter-spacing — top of card
- **Dosage**: `0.8125rem`, muted, own line below name
- **Meta row**: time badge + urgency badge on same line
  - Time: `0.9375rem`, bold, clock icon, muted pill background. Overdue time turns red.
  - Overdue urgency: filled red badge with white text + pulsing dot animation
  - Due-soon urgency: amber badge with dark text
- **Status badge** (right side): filled background, white/dark text, `box-shadow` for lift
  - Taken: green fill, white text
  - Skipped: red fill, white text
  - Snoozed: amber fill, dark text
  - Pending: light muted background
- **Action buttons** (when pending): separated by a subtle top border
  - "Taken": primary — filled green, `box-shadow`, wider visual weight
  - "Snooze": secondary — outlined amber, white background
  - "Skip": secondary — outlined red, white background
- **Hover**: subtle lift (`translateY(-1px)`) + deeper shadow
- **Responsive (mobile)**: body stacks vertically, status badge stays top-right

### MedicationForm Design
- White card with border, 14px radius, 1.5rem padding, sticky in sidebar
- Title with icon: "Add Medication" (plus icon) or "Edit Medication" (pencil icon)
- Labeled fields: uppercase tiny labels (0.75rem, muted, letter-spacing) above each input
- Fields: text inputs for name/dosage, date inputs for start/end date, time input, dropdown for days
- Submit button: blue fill, white text, full width
- Cancel button (edit mode only): light background with border, next to submit
- Error messages shown in red banner above fields

### Adherence Section
- White card with border, 14px radius, 1.5rem padding
- CSS Grid layout: progress ring (left) + 30-day stat (center) + streak (right)
- **SVG circular progress ring** (100x100): shows 7-day percentage
  - Ring background: light gray stroke
  - Ring fill: color changes based on value (red <50%, amber 50-79%, green 80%+)
  - Center label: large percentage number + "7-day" text
- **30-day stat**: large bold number + "Last 30 days" label
- **Streak**: fire icon, large bold number, "Day streak" label, warm orange/amber background card
- Responsive: stacks to single column on mobile, ring centers

### Empty States
- Styled card with dashed border, centered layout
- Large emoji icon (2.5rem, slightly transparent)
- Title: bold, secondary text color
- Description: muted text, max-width 300px, centered
- Action button (when applicable): blue fill pill button
- Used for: no doses today ("All caught up!"), no history, no medications, caregiver no patients

### Toast / Notification System
- Fixed position bottom-center, white text on colored background (green success, red error)
- Rounded pill shape (`border-radius: 9999px`)
- Animates in (slide up + fade in, 0.25s) and out (fade, 0.3s after 1.7s delay)
- Auto-dismisses after 2 seconds
- Used for: dose logged, medication deleted, access revoked, errors

### Mobile Responsiveness
- **900px breakpoint**: Dashboard grid collapses from 2 columns to 1 column. MedicationForm moves out of sticky sidebar. Adherence grid adjusts to 2-column then 1-column layout.
- **600px breakpoint**: Header compacts, padding reduces throughout. Dose cards stack vertically (name/dosage/meta on top, status badge top-right, action buttons wrap). History entries stack vertically. View tabs go full-width. Touch targets maintained at 44px minimum.
- All inputs and buttons have `min-height: 44px` for accessibility

### Overall Visual Quality
- Clean, calm, trustworthy — professional but warm feel
- Consistent spacing, colors, and border radius throughout via CSS variables
- BEM naming convention across all component styles
- No custom fonts, icons, or illustrations beyond the logo and emoji
- No skeleton loading animations — just "Loading..." text
- All styling via CSS classes (zero inline styles in dashboard components)

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
| `PatientDashboard` | `PatientDashboard.jsx` | Main patient view: two-column layout, doses, adherence, medications, history, caregiver access, toast |
| `CaregiverDashboard` | `CaregiverDashboard.jsx` | Caregiver view: single-column, patient selector, read-only doses/adherence/history, invite accept |
| `DoseCard` | `DoseCard.jsx` | Single dose display: separated name/dosage, prominent time, state-colored left border, filled status badges, primary/secondary action buttons, urgency indicators with pulse animation |
| `MedicationForm` | `MedicationForm.jsx` | Add/Edit medication form with labeled fields, validation, sticky sidebar positioning |
| `AdherenceStat` | `AdherenceStat.jsx` | SVG circular progress ring (7-day), 30-day stat, streak with fire icon |

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
- Custom CSS with CSS variables, BEM naming, no CSS framework

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
- GitHub: `https://github.com/itzkennedy/medtrack.git`
- Branch: `main`
- Root: `medtrack/` (nested under `MEDTRACK/`)

### CSS Files
- `client/src/index.css` — Global reset, design tokens (colors, shadows, spacing, radius), button/input globals, toast styles
- `client/src/Dashboard.css` — All dashboard and component styles (BEM naming): dose cards, adherence, medications, history, empty states, error banners, responsive breakpoints
