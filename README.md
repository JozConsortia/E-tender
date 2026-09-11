# TenderLens — AI-Assisted Electronic Tendering Platform

An electronic tendering (e-procurement) platform built for the Mpumalanga Provincial Treasury use case: administrators publish tenders, suppliers submit bids through a structured form, and a strict role-separated workflow (BEC → BAC → Final Approver) evaluates, adjudicates and awards them — with AI-assisted document screening and automated fraud/misuse detection along the way.

## Architecture

```text
React 18 + TypeScript + Vite (frontend)
        |
        | REST / JSON, JWT bearer auth
        v
Node.js + Express 5 + TypeScript (backend)
        |
        +-- Auth & RBAC (JWT, bcrypt password hashing, account lockout)
        +-- Tender lifecycle (draft -> publish -> evaluation -> adjudication -> approval -> award)
        +-- Applicant bid submissions (structured form + document evidence)
        +-- AI document screening (keyword-matching heuristic, runs on every submission)
        +-- AI Document Assessment (Google Gemini, admin tool, optional/separate from the above)
        +-- BEC evaluation / BAC adjudication / Final approval
        +-- Audit log (every state-changing action)
        +-- Security alerts (fraud & misuse detection) + optional email delivery
        |
        v
Prisma ORM
        |
        v
MySQL (persistent storage)
```

## Roles and strict separation

| Role | Can do |
|---|---|
| **Administrator** | Create/publish tenders, verify supplier companies, correct company names, view all tenders/audit, review Security Alerts, use the AI Document Assessment tool |
| **Applicant / Bidder** | Browse published tenders, submit one bid per tender (structured form + documents), view own applications and outcomes only |
| **BEC** (Bid Evaluation Committee) | Score bids for tenders currently in evaluation, record a rationale, view the AI screening result |
| **BAC** (Bid Adjudication Committee) | Review BEC-shortlisted bids, approve for final approval or return to BEC |
| **Approver** | Approve, decline, or return award recommendations — the only role that finalises an award |
| **Auditor** | Read-only visibility across all tenders, applications and the full audit trail |

A user only ever sees the workspace for their own role (enforced both by frontend routing and backend authorization on every endpoint). Staff accounts (ADMIN/BEC/BAC/APPROVER/AUDITOR) are barred from being declared directors of an applying company — this is checked at registration, at bid submission, and at company-verification approval, and any attempted breach raises a Security Alert.

## Tender & application lifecycle

```text
DRAFT --(admin publishes)--> PUBLISHED --(closing date passes, or admin advances)--> EVALUATION
  --(every application resolved)--> ADJUDICATION --(BAC approves)--> APPROVAL --(Approver approves)--> AWARDED

Application: SUBMITTED -> UNDER_EVALUATION -> SHORTLISTED -> SUCCESSFUL / UNSUCCESSFUL
                       \                                  \-> REVIEW_REQUIRED --(BEC re-scores)--> SHORTLISTED / REVIEW_REQUIRED
                        \-> UNSUCCESSFUL (rejected instantly at submission if mandatory evidence is missing)
```

The tender and its applications advance together — a tender only reaches ADJUDICATION once every one of its applications has reached a resolved state (`SHORTLISTED`, `REVIEW_REQUIRED`, `SUCCESSFUL` or `UNSUCCESSFUL`), and only reaches AWARDED once the Approver signs off. An application rejected at submission (missing mandatory evidence) or scored below 70 by BEC does **not** block sibling bids on the same tender from proceeding. `POST /api/tenders/:id/advance` lets an admin force the next transition in a demo/testing context without waiting for a real closing date.

## Applicant bid form

Submitting a bid requires:
- **Bid summary** and **technical approach** (free text, min. 20 characters each)
- **Delivery timeline** and **total price**
- **Compliance declaration** (checkbox — bidder confirms compliance with tender terms)
- One attached document per published requirement (PDF/JPG/PNG)

On submission, a lightweight keyword-matching AI check compares attached document filenames against the tender's published requirements. If any mandatory requirement has no matching evidence, the application is **rejected immediately** — status `UNSUCCESSFUL`, with the missing items recorded — and the applicant sees this as a final outcome straight away (My Applications / Outcomes) rather than waiting on a committee. If all mandatory evidence is present, the bid proceeds normally into the evaluation pipeline. BEC, BAC and the Approver can each open a print-friendly **bid report** (`/applications/:id/report`) showing the full form, documents, and AI/committee notes — "Print / Save as PDF" uses the browser's native print dialog.

## AI Document Assessment (admin tool)

A separate, optional tool (Admin → Document Assessment) lets an admin upload any single document (PDF/PNG/JPEG/WEBP) and have Google Gemini extract its type, company name, reference number, issue/expiry dates, and flag missing information or expiry status. This is independent of the per-bid document screening above and requires a valid `GEMINI_API_KEY`.

## Fraud & misuse detection (Security Alerts)

The backend raises a `SecurityAlert` (visible to admins under **Security Alerts**, with an unread-count bell in the topbar) whenever it detects:

| Trigger | Severity |
|---|---|
| 5 consecutive failed sign-ins on one account (also locks the account for 15 minutes) | HIGH |
| A declared company director matches an internal staff account — at registration, bid submission, or verification approval | HIGH |
| A submitted document's filename is identical to one used by a *different* company | MEDIUM |
| A company receives its 3rd (or later) award | MEDIUM |
| A company is awarded despite a prior unresolved director-conflict flag against it | HIGH |
| A company's registered name is changed by an admin | MEDIUM |

Alerts are always recorded in-app. If `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`ALERT_EMAIL_TO` are set in `backend/.env`, each alert is also emailed; otherwise the backend logs a one-time console warning and continues in-app-only.

## Tech stack

- **Frontend**: React 18, TypeScript, Vite, React Router
- **Backend**: Node.js, Express 5, TypeScript (run via `tsx`)
- **Database**: MySQL, accessed through Prisma ORM (driver adapter, no native engine binary)
- **Auth**: JWT (`jsonwebtoken`), password hashing via `bcryptjs`
- **AI**: `@google/genai` (Gemini) for document assessment; a self-contained keyword-matching heuristic for per-bid document screening (no external call)
- **Email**: `nodemailer` (SMTP), optional

## Database schema

Defined in `backend/prisma/schema.prisma`, 7 tables:

| Table | Purpose |
|---|---|
| `user` | All accounts across every role; `password` is bcrypt-hashed; `directors`/`verificationDocuments` are JSON-encoded text |
| `tender` | A tender package: reference, title, status, closing date |
| `tenderrequirement` | Mandatory/optional evidence items per tender |
| `evaluationcriterion` | Scoring weights per tender (must total 100%) |
| `application` | A bid: form fields, documents (JSON-encoded text), AI screening result, committee notes, status |
| `auditlog` | Append-only activity trail |
| `securityalert` | Fraud/misuse flags, resolved/unresolved, with severity |

## Running it locally

**Prerequisites**: Node.js, a running MySQL server, and a database + user already created (see `backend/prisma/schema.prisma` for the shape — `npx prisma db push` will create/sync the tables against an empty database).

```powershell
# Backend
cd backend
npm install
copy .env.example .env    # then fill in DATABASE_URL and JWT_SECRET at minimum
npx prisma generate
npx prisma db push        # only needed once, or after a schema change
npm run dev                # http://localhost:5000
```

```powershell
# Frontend (second terminal)
cd frontend
npm install
npm run dev                # http://localhost:5173
```

Useful backend scripts: `npm run db:studio` (visual database browser), `npm run db:generate` (regenerate the Prisma client after a schema edit), `npm run db:pull` (re-sync the schema file from the live database), `npm run db:seed-demo` (adds 6 additional demo tenders — see below), `npm run build` + `npm start` (production build).

## Demo dataset

The seed data spans **12 tenders across every lifecycle stage** so every role's dashboard has something to show:

| Stage | Count | Example |
|---|---|---|
| DRAFT | 1 | `MPG/AGR/2026/007` — publish it live to demo the Admin workflow |
| PUBLISHED (open for bids) | 3 | `MPG/ICT/2026/001`, `MPG/DEDT/2026/002`, `MPG/CORP/2026/004` |
| EVALUATION | 2 | `MPG/PWRT/2026/003`, `MPG/HLTH/2026/008` — each has a bid ready for BEC to score |
| ADJUDICATION | 2 | `MPG/TREAS/2026/005`, `MPG/RDS/2026/009` — each has a shortlisted bid ready for BAC |
| APPROVAL | 1 | `MPG/SAFE/2026/010` — a shortlisted bid ready for the Approver's final decision |
| AWARDED | 2 | `MPG/EDU/2026/006`, `MPG/SPORT/2026/011` — each with a winning and a losing bid |
| CANCELLED | 1 | `MPG/TOUR/2026/012` — an award declined at final approval |

The first 6 (`t-001`–`t-006`) come from the base database; the other 6 are added by `backend/scripts/seed-more-tenders.ts` (run automatically once via `npm run db:seed-demo` — safe to re-run, it skips if they already exist).

## Login credentials for testing

Kept out of this file and out of the login page itself so the app doesn't advertise test accounts to the public — see `CREDENTIALS.md`.

## API reference

See `API.md` for the full endpoint list.
