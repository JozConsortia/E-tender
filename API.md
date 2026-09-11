# API overview

Base URL: `http://localhost:5000/api`

## Public

- `GET /health` — backend health.
- `GET /tenders` — public published/awarded tender list.
- `GET /tenders/:id` — published tender details.

## Authentication

- `POST /auth/login` — returns a JWT and safe user profile.
- `GET /auth/me` — returns the authenticated user.
- `POST /auth/register` — registers a supplier/applicant company for verification.

## Applicant

- `GET /applications/mine` — own submissions only.
- `POST /applications` — submit an application while a tender is open.

## Administrator

- `GET /bootstrap` — role-filtered administration data.
- `POST /tenders` — create a draft tender.
- `POST /tenders/:id/publish` — publish a tender package.
- `GET /users` — safe user data for company verification.
- `POST /users/:id/verification` — approve/reject supplier verification.
- `GET /audit` — admin audit log.

## BEC

- `GET /bec/evaluations` — assigned evaluation cases.
- `POST /bec/evaluations/:id` — submit a BEC evaluation.

## BAC

- `GET /bac/cases` — adjudication cases.
- `POST /bac/cases/:id` — refer to approval or return to BEC.

## Final approval

- `GET /approval/pending` — cases waiting for final approval.
- `POST /approval/:id` — approve, return or decline an award recommendation.

For the demo, documents are represented as filenames in JSON rather than uploaded files. A production version should add multipart upload, secure object storage and persistent audit records.
