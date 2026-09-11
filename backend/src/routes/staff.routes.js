import { Router } from 'express';
import { applications, auditLogs, tenders, users } from '../data/store.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { analyzeApplication } from '../services/ai.service.js';
import { addAudit, syncTenderLifecycle } from '../services/workflow.service.js';
const router = Router();
router.get('/users', authenticate, authorize('ADMIN'), (_req, res) => {
    const safe = users.map(({ password: _p, ...user }) => user);
    return res.json(safe);
});
router.post('/users/:id/verification', authenticate, authorize('ADMIN'), (req, res) => {
    const user = users.find((u) => u.id === req.params.id && u.role === 'APPLICANT');
    if (!user)
        return res.status(404).json({ message: 'Applicant not found.' });
    const status = req.body?.status;
    const note = String(req.body?.note ?? '').trim();
    if (!['APPROVED', 'REJECTED'].includes(status))
        return res.status(400).json({ message: 'Invalid verification status.' });
    if (status === 'APPROVED') {
        const conflict = (user.directors ?? []).some((d) => users.some((s) => ['ADMIN', 'BEC', 'BAC', 'APPROVER', 'AUDITOR'].includes(s.role) && s.name.toLowerCase() === d.toLowerCase()));
        if (conflict)
            return res.status(400).json({ message: 'A staff director conflict prevents approval.' });
    }
    user.verificationStatus = status;
    user.verificationNote = note;
    addAudit(req.user.name, `${status === 'APPROVED' ? 'Approved' : 'Rejected'} company verification`, user.organisation ?? user.email);
    const { password: _p, ...safe } = user;
    return res.json(safe);
});
router.get('/audit', authenticate, authorize('ADMIN', 'AUDITOR'), (_req, res) => res.json(auditLogs));
router.get('/bec/evaluations', authenticate, authorize('BEC'), (req, res) => {
    syncTenderLifecycle();
    const activeTenders = new Set(tenders.filter((t) => t.status === 'EVALUATION').map((t) => t.id));
    return res.json(applications.filter((a) => activeTenders.has(a.tenderId)));
});
router.post('/bec/evaluations/:id', authenticate, authorize('BEC'), (req, res) => {
    syncTenderLifecycle();
    const application = applications.find((a) => a.id === req.params.id);
    const tender = application ? tenders.find((t) => t.id === application.tenderId) : undefined;
    if (!application || !tender || tender.status !== 'EVALUATION' || !['UNDER_EVALUATION', 'REVIEW_REQUIRED'].includes(application.status))
        return res.status(400).json({ message: 'This application is not available for BEC evaluation.' });
    const score = Math.max(0, Math.min(100, Math.round(Number(req.body?.score))));
    const note = String(req.body?.note ?? '').trim();
    if (!note || note.length < 10)
        return res.status(400).json({ message: 'A BEC rationale of at least 10 characters is required.' });
    const ai = application.aiScore === undefined ? analyzeApplication(application, tender) : { aiScore: application.aiScore, aiRecommendation: application.aiRecommendation ?? (application.aiScore >= 70 ? 'QUALIFY' : 'REVIEW REQUIRED'), aiSummary: application.aiSummary ?? 'AI-assisted analysis available.' };
    application.status = score >= 70 ? 'SHORTLISTED' : 'REVIEW_REQUIRED';
    application.aiScore = ai.aiScore;
    application.aiRecommendation = ai.aiRecommendation;
    application.aiSummary = ai.aiSummary;
    application.finalScore = score;
    application.functionalityScore = Math.round(score * 0.4);
    application.priceScore = Math.round(score * 0.3);
    application.preferenceScore = score - application.functionalityScore - application.priceScore;
    application.becNote = note;
    addAudit(req.user.name, 'Submitted BEC evaluation', `Application ${application.id}`);
    syncTenderLifecycle();
    return res.json(application);
});
router.get('/bac/cases', authenticate, authorize('BAC'), (req, res) => {
    syncTenderLifecycle();
    const ids = new Set(tenders.filter((t) => t.status === 'ADJUDICATION').map((t) => t.id));
    return res.json(applications.filter((a) => ids.has(a.tenderId) && a.status === 'SHORTLISTED'));
});
router.post('/bac/cases/:id', authenticate, authorize('BAC'), (req, res) => {
    syncTenderLifecycle();
    const application = applications.find((a) => a.id === req.params.id);
    const tender = application ? tenders.find((t) => t.id === application.tenderId) : undefined;
    const decision = req.body?.decision;
    const note = String(req.body?.note ?? '').trim();
    if (!application || !tender || tender.status !== 'ADJUDICATION' || application.status !== 'SHORTLISTED')
        return res.status(400).json({ message: 'This case is not available for BAC adjudication.' });
    if (!note || note.length < 10)
        return res.status(400).json({ message: 'A BAC rationale of at least 10 characters is required.' });
    if (decision === 'APPROVE') {
        application.bacNote = note;
        tender.status = 'APPROVAL';
        addAudit(req.user.name, 'Referred recommendation to final approval', tender.reference);
    }
    else if (decision === 'RETURN') {
        application.status = 'REVIEW_REQUIRED';
        application.bacNote = note;
        tender.status = 'EVALUATION';
        addAudit(req.user.name, 'Returned recommendation to BEC', tender.reference);
    }
    else
        return res.status(400).json({ message: 'Invalid adjudication decision.' });
    return res.json(application);
});
router.get('/approval/pending', authenticate, authorize('APPROVER'), (req, res) => {
    syncTenderLifecycle();
    const ids = new Set(tenders.filter((t) => t.status === 'APPROVAL').map((t) => t.id));
    return res.json(applications.filter((a) => ids.has(a.tenderId) && a.status === 'SHORTLISTED'));
});
router.post('/approval/:id', authenticate, authorize('APPROVER'), (req, res) => {
    syncTenderLifecycle();
    const application = applications.find((a) => a.id === req.params.id);
    const tender = application ? tenders.find((t) => t.id === application.tenderId) : undefined;
    const decision = req.body?.decision;
    const note = String(req.body?.note ?? '').trim();
    if (!application || !tender || tender.status !== 'APPROVAL' || application.status !== 'SHORTLISTED')
        return res.status(400).json({ message: 'This case is not available for final approval.' });
    if (!note || note.length < 10)
        return res.status(400).json({ message: 'An approval rationale of at least 10 characters is required.' });
    if (decision === 'APPROVE') {
        for (const item of applications.filter((a) => a.tenderId === tender.id))
            item.status = item.id === application.id ? 'SUCCESSFUL' : 'UNSUCCESSFUL';
        application.approvalNote = note;
        tender.status = 'AWARDED';
        addAudit(req.user.name, 'Approved final award', tender.reference);
    }
    else if (decision === 'RETURN') {
        application.approvalNote = note;
        tender.status = 'ADJUDICATION';
        addAudit(req.user.name, 'Returned award recommendation to BAC', tender.reference);
    }
    else if (decision === 'DECLINE') {
        for (const item of applications.filter((a) => a.tenderId === tender.id)) {
            item.status = 'UNSUCCESSFUL';
            item.approvalNote = note;
        }
        tender.status = 'CANCELLED';
        addAudit(req.user.name, 'Declined final award', tender.reference);
    }
    else
        return res.status(400).json({ message: 'Invalid approval decision.' });
    return res.json(application);
});
export default router;
