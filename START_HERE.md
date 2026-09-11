# Start Here

## 1. Backend first

```powershell
cd backend
npm install
npm run dev
```

Expected: `AI e-Tender backend running on http://localhost:5000`

Check: open `http://localhost:5000/api/health`

## 2. Frontend in a second terminal

```powershell
cd frontend
npm install
npm run dev
```

Expected Vite URL: `http://localhost:5173`

## 3. Demo logins

- Admin: admin@etender.org / Admin123!
- Applicant: applicant@etender.org / Applicant123!
- BEC: bec@etender.org / BEC123!
- BAC: bac@etender.org / BAC123!
- Final Approver: approver@etender.org / Approve123!
- Auditor: auditor@etender.org / Audit123!

## 4. Demo workflow

Use these accounts in order:

1. Applicant views an OPEN tender and submits a bid.
2. Admin creates/publishes tender packages and verifies supplier companies.
3. After the closing time, the backend changes the tender to EVALUATION.
4. BEC evaluates the submission and confirms the AI-assisted score.
5. BAC adjudicates the BEC recommendation.
6. Final Approver approves, returns, or declines the recommendation.
7. Applicant sees only the outcome for their own submission.

## 5. No database yet

The backend uses in-memory arrays. Restarting the backend resets demo data.

## 6. Documents

The current demo uses document filenames in JSON to simulate uploads. It intentionally does not persist real files yet.
