import { Router } from 'express';
import authRoutes from './auth.routes.js';
import tenderRoutes from './tender.routes.js';
import applicationRoutes from './application.routes.js';
import staffRoutes from './staff.routes.js';
import { users, tenders, applications, auditLogs } from '../data/store.js';
import { authenticate } from '../middleware/auth.js';
import { syncTenderLifecycle } from '../services/workflow.service.js';
const router = Router();
router.get('/health', (_req, res) => res.json({ status: 'ok', database: 'not configured', storage: 'in-memory' }));
router.post('/demo/reset', (_req, res) => {
    // Development/demo only. The server process is intentionally the source of truth and has no DB yet.
    return res.json({ message: 'Restart the backend process to restore the seed data.' });
});
router.get('/bootstrap', authenticate, (req, res) => {
    syncTenderLifecycle();
    const safeUsers = users.map(({ password: _p, ...user }) => user);
    if (req.user.role === 'APPLICANT') {
        return res.json({
            users: safeUsers.filter((user) => user.id === req.user.id),
            tenders: tenders.filter((t) => ['PUBLISHED', 'AWARDED'].includes(t.status)),
            applications: applications.filter((a) => a.applicantId === req.user.id),
            auditLogs: [],
        });
    }
    if (req.user.role === 'BEC') {
        const ids = new Set(tenders.filter((t) => t.status === 'EVALUATION').map((t) => t.id));
        return res.json({ users: [], tenders: tenders.filter((t) => ids.has(t.id)), applications: applications.filter((a) => ids.has(a.tenderId)), auditLogs: [] });
    }
    if (req.user.role === 'BAC') {
        const ids = new Set(tenders.filter((t) => t.status === 'ADJUDICATION').map((t) => t.id));
        return res.json({ users: [], tenders: tenders.filter((t) => ids.has(t.id)), applications: applications.filter((a) => ids.has(a.tenderId) && a.status === 'SHORTLISTED'), auditLogs: [] });
    }
    if (req.user.role === 'APPROVER') {
        const ids = new Set(tenders.filter((t) => t.status === 'APPROVAL' || t.status === 'AWARDED').map((t) => t.id));
        return res.json({ users: [], tenders: tenders.filter((t) => ids.has(t.id)), applications: applications.filter((a) => ids.has(a.tenderId)), auditLogs: [] });
    }
    if (req.user.role === 'AUDITOR')
        return res.json({ users: safeUsers, tenders, applications, auditLogs });
    return res.json({ users: safeUsers, tenders, applications, auditLogs });
});
router.use('/auth', authRoutes);
router.use('/tenders', tenderRoutes);
router.use('/applications', applicationRoutes);
router.use('/', staffRoutes);
export default router;
