# AI e-Tendering System — Frontend + Backend Demo

This project contains the React + TypeScript + Vite frontend and a Node.js + Express + TypeScript backend. No database is included yet; the backend uses in-memory demo data and is the source of truth while it is running.

## Architecture

```text
React + Vite + TypeScript (frontend :5173)
        |
        | REST / JSON + JWT
        v
Node.js + Express + TypeScript (backend :5000)
        |
        +-- Authentication / RBAC
        +-- Tender lifecycle
        +-- Applicant submissions
        +-- BEC evaluation
        +-- BAC adjudication
        +-- Final approval
        +-- Audit logs
        +-- AI-assisted demo analysis
        +-- In-memory store (no database yet)
```

## Strict role separation

- Applicant: published tenders, own applications, own outcomes only.
- Administrator: tender requirements, tender creation/publication, supplier verification, admin audit.
- BEC: evaluation register, bid evidence, AI-assisted analysis, BEC recommendation.
- BAC: adjudication register and BAC recommendation.
- Final Approver: final approval / return / decline.
- Auditor: read-only oversight and audit trail.

Staff roles cannot submit tenders as applicants, and the supplier registration/apply flow checks declared company directors against staff accounts in the demo.

## Workflow

```text
ADMIN PUBLISHES
      -> APPLICANT SUBMITS
      -> CLOSING TIME
      -> SYSTEM MOVES TO EVALUATION
      -> AI-ASSISTED DOCUMENT ANALYSIS
      -> BEC EVALUATION
      -> BEC RECOMMENDATION
      -> BAC ADJUDICATION
      -> FINAL APPROVAL
      -> AWARD / NO AWARD
      -> APPLICANT VIEWS OUTCOME
```

The AI is advisory. It does not make the final procurement award.

## AI document rules

- A submission with fewer than three documents is rejected by the AI review, scored 0, and never reaches the BEC.
- A submission missing mandatory evidence is flagged for human review instead of being evaluated.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Administrator | admin@etender.org | Admin123! |
| Applicant | applicant@etender.org | Applicant123! |
| Applicant (walkthrough) | applicant.walkthrough@etender.org | Walkthrough123! |
| Pending applicant | supplier.pending@etender.org | Supplier123! |
| BEC | bec@etender.org | BEC123! |
| BAC | bac@etender.org | BAC123! |
| Final Approver | approver@etender.org | Approve123! |
| Auditor | auditor@etender.org | Audit123! |

## Run backend

```powershell
cd backend
npm install
npm run dev
```

Backend: `http://localhost:5000`

## Run frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

Optional frontend API override:

```text
frontend/.env
VITE_API_URL=http://localhost:5000/api
```

## Reset demo data

Because there is no database, the backend seed data is restored by restarting the backend process.

```powershell
Ctrl+C
npm run dev
```

The frontend stores only the JWT token in localStorage. Sign out to clear the active session.
