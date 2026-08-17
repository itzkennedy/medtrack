# MedTrack

A lightweight medication adherence tracker — React + Node.js/Express + MySQL.

## Quick Start

### Prerequisites

- Node.js >= 18
- MySQL >= 8.0 (or MariaDB 10.5+)

### 1. Clone the repo

```bash
git clone <repo-url> medtrack
cd medtrack
```

### 2. Install dependencies

```bash
cd client && npm install
cd ../server && npm install
```

### 3. Configure environment

```bash
cd server
cp .env.example .env
# Edit .env with your MySQL credentials and a JWT secret
```

### 4. Initialize the database

```bash
cd server
npm run db:init
```

This creates the `medtrack` database and all tables from `db/schema.sql`.

### 5. Start development servers

Open two terminals:

```bash
# Terminal 1 — API
cd server
npm run dev        # runs on http://localhost:3000

# Terminal 2 — Frontend
cd client
npm run dev        # runs on http://localhost:5173
```

The Vite dev server proxies `/api` requests to port 3000.

## Project Structure

```
medtrack/
├── client/          React (Vite) frontend
├── server/          Express API backend
├── db/schema.sql    MySQL schema
└── docs/            Wireframes, ER diagram
```

## Sprint Status

| Sprint | Focus | Status |
|--------|-------|--------|
| 0 | Repo scaffold, schema, static UI | **Done** |
| 1 | Auth (JWT), route logic | Planned |
| 2 | Dose logging, adherence stats | Planned |
| 3 | Caregiver linking | Planned |
| 4–8 | Polish, notifications, testing | Planned |

## Tech Stack

- **Frontend:** React 18, React Router 6, Vite
- **Backend:** Node.js, Express 4
- **Database:** MySQL (mysql2/promise)
- **Auth:** JWT (Sprint 1+)
