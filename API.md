# API reference

Base URL: `http://localhost:5000/api`

All endpoints except the public ones below require `Authorization: Bearer <token>` from `POST /auth/login`. Role restrictions are noted per endpoint.

## Public

- `GET /health` — backend/database status.
- `GET /tenders` — published/awarded tenders only.
- `GET /tenders/:id` — a single tender (published/awarded tenders are visible to anyone; other statuses require staff auth).

## Authentication

- `POST /auth/login` — `{ email, password }` → `{ token, user }`. Locks the account for 15 minutes after 5 consecutive failures and raises a Security Alert.
- `GET /auth/me` — the authenticated user's profile.
- `POST /auth/register` — `{ name, email, password, organisation, director, documents: string[3] }` — registers a new APPLICANT (verification status `PENDING`). Rejects and alerts if the declared director matches a staff account.

## Applicant

- `GET /applications/mine` — the applicant's own submissions.
- `POST /applications` — submit a bid for an open, published tender. Body: `{ tenderId, companyName, documents: string[], bidSummary, technicalApproach, deliveryTimeline, pricingAmount, complianceDeclaration: true }`. Requires an APPROVED verification status; blocks (and alerts) on a director conflict; flags (without blocking) if a document filename duplicates one from another company.

## Administrator

- `GET /bootstrap` — role-scoped snapshot of users/tenders/applications/audit (and, for ADMIN, unresolved `alerts`). Every role calls this on login.
- `GET /users` — all users (safe fields only).
- `POST /users/:id/verification` — `{ status: 'APPROVED'|'REJECTED', note }` — approve/reject a supplier's company verification.
- `PATCH /users/:id/organisation` — `{ organisation }` — correct a supplier's registered company name (raises a Security Alert).
- `POST /tenders` — `{ title, department, description, closingDate, requirements: [{title, mandatory}], criteria: [{title, weight}] }` (weights must total 100) — creates a DRAFT tender.
- `POST /tenders/:id/publish` — DRAFT → PUBLISHED (closing date must be in the future).
- `POST /tenders/:id/advance` — force the tender to its next lifecycle stage (used to move a demo forward without waiting for a real closing date).
- `GET /audit` — full audit log (ADMIN or AUDITOR).
- `GET /applications/all` — every application, any status (ADMIN or AUDITOR).
- `GET /tenders?scope=all` — every tender regardless of status (ADMIN or AUDITOR).

## AI Document Assessment

- `POST /documents/analyse` — multipart upload, field name `document` (PDF/PNG/JPEG/WEBP, ≤50MB). ADMIN only. Requires `GEMINI_API_KEY`.

## Security alerts

- `GET /alerts` — list alerts, most recent first. Optional `?resolved=true|false` filter. ADMIN only.
- `POST /alerts/:id/resolve` — mark an alert resolved. ADMIN only.

## BEC

- `GET /bec/evaluations` — bids ready for scoring (tender in EVALUATION, application `UNDER_EVALUATION`, all mandatory evidence present).
- `POST /bec/evaluations/:id` — `{ score, note }` (note ≥10 chars) — records the score; ≥70 shortlists the bid for BAC, otherwise flags it `REVIEW_REQUIRED`.

## BAC

- `GET /bac/cases` — shortlisted bids for tenders in ADJUDICATION.
- `POST /bac/cases/:id` — `{ decision: 'APPROVE'|'RETURN', note }` (note ≥10 chars) — APPROVE moves the tender to APPROVAL; RETURN sends the bid back to REVIEW_REQUIRED and the tender back to EVALUATION.

## Final approval

- `GET /approval/pending` — shortlisted bids for tenders in APPROVAL.
- `POST /approval/:id` — `{ decision: 'APPROVE'|'RETURN'|'DECLINE', note }` (note ≥10 chars). APPROVE awards the tender (and marks every other bid on it UNSUCCESSFUL); RETURN sends it back to BAC; DECLINE cancels the tender entirely.

---

Documents are stored as filenames only (JSON-encoded text in the database) rather than uploaded binary files — a production version would add real multipart upload with secure object storage for bid evidence (the AI Document Assessment tool already demonstrates real file upload/analysis for a single document at a time).
