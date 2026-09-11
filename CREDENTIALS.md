# Test accounts

Demo/seed accounts for trying out each role. These are **not shown on the login page itself** (removed intentionally so the live app doesn't advertise test logins to the public) — use this file instead.

Sign in at `/login` with any of these:

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@etender.org` | `Admin123!` |
| Applicant / Bidder | `applicant@etender.org` | `Applicant123!` |
| Applicant (second company, for cross-company testing) | `applicant.walkthrough@etender.org` | `Walkthrough123!` |
| Applicant (pending verification) | `supplier.pending@etender.org` | `Supplier123!` |
| Bid Evaluation Committee (BEC) | `bec@etender.org` | `BEC123!` |
| Bid Adjudication Committee (BAC) | `bac@etender.org` | `BAC123!` |
| Final Approver | `approver@etender.org` | `Approve123!` |
| Auditor | `auditor@etender.org` | `Audit123!` |

## Notes

- The browser only holds one signed-in session at a time (one JWT in `localStorage`). To check two roles side by side, open a second private/incognito window rather than a second tab.
- `supplier.pending@etender.org` is deliberately left in `PENDING` verification status — log in as Administrator → Company Verification to approve or reject it, and see what an unverified applicant can/can't do.
- A wrong password 5 times in a row locks that account for 15 minutes and raises a Security Alert (Administrator → Security Alerts) — don't test the lockout on an account you need again soon.
- These are seeded demo accounts with intentionally simple passwords. **Rotate or remove them before any real/production deployment** — do not reuse this credential set outside of demo/testing.
