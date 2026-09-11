import { Router } from 'express'
import { prisma } from '../prisma.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { analyzeApplication } from '../services/ai.service.js'
import { addAudit, syncTenderLifecycle } from '../services/workflow.service.js'
import { parseJsonArray, toApplicationDTO, toAuditDTO, toSafeUser } from '../lib/serialize.js'

const router = Router()

router.get('/users', authenticate, authorize('ADMIN'), async (_req, res) => {
  const users = await prisma.user.findMany()
  return res.json(users.map(toSafeUser))
})

router.post('/users/:id/verification', authenticate, authorize('ADMIN'), async (req, res) => {
  const user = await prisma.user.findFirst({ where: { id: String(req.params.id), role: 'APPLICANT' } })
  if (!user) return res.status(404).json({ message: 'Applicant not found.' })
  const status = req.body?.status
  const note = String(req.body?.note ?? '').trim()
  if (!['APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ message: 'Invalid verification status.' })
  if (status === 'APPROVED') {
    const directors = parseJsonArray(user.directors) ?? []
    const staff = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'BEC', 'BAC', 'APPROVER', 'AUDITOR'] } } })
    const conflict = directors.some((d) => staff.some((s) => s.name.toLowerCase() === d.toLowerCase()))
    if (conflict) return res.status(400).json({ message: 'A staff director conflict prevents approval.' })
  }
  const updated = await prisma.user.update({ where: { id: user.id }, data: { verificationStatus: status, verificationNote: note } })
  await addAudit(req.user!.name, `${status === 'APPROVED' ? 'Approved' : 'Rejected'} company verification`, updated.organisation ?? updated.email)
  return res.json(toSafeUser(updated))
})

router.get('/audit', authenticate, authorize('ADMIN', 'AUDITOR'), async (_req, res) => {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' } })
  return res.json(logs.map(toAuditDTO))
})

router.get('/bec/evaluations', authenticate, authorize('BEC'), async (_req, res) => {
  await syncTenderLifecycle()
  const applications = await prisma.application.findMany({ where: { status: 'UNDER_EVALUATION', tender: { status: 'EVALUATION' } } })
  const filtered = applications.filter((application) => {
    const missing = parseJsonArray(application.missingMandatoryDocuments)?.length ?? 0
    const valid = parseJsonArray(application.validDocuments)?.length ?? parseJsonArray(application.documents)?.length ?? 0
    return missing === 0 && valid > 0
  })
  return res.json(filtered.map(toApplicationDTO))
})

router.post('/bec/evaluations/:id', authenticate, authorize('BEC'), async (req, res) => {
  await syncTenderLifecycle()
  const application = await prisma.application.findUnique({ where: { id: String(req.params.id) }, include: { tender: { include: { requirements: true } } } })
  if (!application || application.tender.status !== 'EVALUATION' || application.status !== 'UNDER_EVALUATION') return res.status(400).json({ message: 'This application is not available for BEC evaluation.' })

  const score = Math.max(0, Math.min(100, Math.round(Number(req.body?.score))))
  const note = String(req.body?.note ?? '').trim()
  if (!note || note.length < 10) return res.status(400).json({ message: 'A BEC rationale of at least 10 characters is required.' })

  const ai = application.aiScore === null
    ? analyzeApplication({ documents: parseJsonArray(application.documents) ?? [] }, application.tender)
    : { aiScore: application.aiScore, aiRecommendation: application.aiRecommendation ?? (application.aiScore >= 70 ? 'QUALIFY' : 'REVIEW REQUIRED'), aiSummary: application.aiSummary ?? 'AI-assisted analysis available.' }

  const functionalityScore = Math.round(score * 0.4)
  const priceScore = Math.round(score * 0.3)

  const updated = await prisma.application.update({
    where: { id: application.id },
    data: {
      status: score >= 70 ? 'SHORTLISTED' : 'REVIEW_REQUIRED',
      aiScore: ai.aiScore,
      aiRecommendation: ai.aiRecommendation,
      aiSummary: ai.aiSummary,
      finalScore: score,
      functionalityScore,
      priceScore,
      preferenceScore: score - functionalityScore - priceScore,
      becNote: note,
    },
  })
  await addAudit(req.user!.name, 'Submitted BEC evaluation', `Application ${application.id}`)
  await syncTenderLifecycle()
  return res.json(toApplicationDTO(updated))
})

router.get('/bac/cases', authenticate, authorize('BAC'), async (_req, res) => {
  await syncTenderLifecycle()
  const applications = await prisma.application.findMany({ where: { status: 'SHORTLISTED', tender: { status: 'ADJUDICATION' } } })
  return res.json(applications.map(toApplicationDTO))
})

router.post('/bac/cases/:id', authenticate, authorize('BAC'), async (req, res) => {
  await syncTenderLifecycle()
  const application = await prisma.application.findUnique({ where: { id: String(req.params.id) }, include: { tender: true } })
  const decision = req.body?.decision
  const note = String(req.body?.note ?? '').trim()
  if (!application || application.tender.status !== 'ADJUDICATION' || application.status !== 'SHORTLISTED') return res.status(400).json({ message: 'This case is not available for BAC adjudication.' })
  if (!note || note.length < 10) return res.status(400).json({ message: 'A BAC rationale of at least 10 characters is required.' })

  let updated
  if (decision === 'APPROVE') {
    updated = await prisma.application.update({ where: { id: application.id }, data: { bacNote: note } })
    await prisma.tender.update({ where: { id: application.tenderId }, data: { status: 'APPROVAL' } })
    await addAudit(req.user!.name, 'Referred recommendation to final approval', application.tender.reference)
  } else if (decision === 'RETURN') {
    updated = await prisma.application.update({ where: { id: application.id }, data: { status: 'REVIEW_REQUIRED', bacNote: note } })
    await prisma.tender.update({ where: { id: application.tenderId }, data: { status: 'EVALUATION' } })
    await addAudit(req.user!.name, 'Returned recommendation to BEC', application.tender.reference)
  } else {
    return res.status(400).json({ message: 'Invalid adjudication decision.' })
  }
  return res.json(toApplicationDTO(updated))
})

router.get('/approval/pending', authenticate, authorize('APPROVER'), async (_req, res) => {
  await syncTenderLifecycle()
  const applications = await prisma.application.findMany({ where: { status: 'SHORTLISTED', tender: { status: 'APPROVAL' } } })
  return res.json(applications.map(toApplicationDTO))
})

router.post('/approval/:id', authenticate, authorize('APPROVER'), async (req, res) => {
  await syncTenderLifecycle()
  const application = await prisma.application.findUnique({ where: { id: String(req.params.id) }, include: { tender: true } })
  const decision = req.body?.decision
  const note = String(req.body?.note ?? '').trim()
  if (!application || application.tender.status !== 'APPROVAL' || application.status !== 'SHORTLISTED') return res.status(400).json({ message: 'This case is not available for final approval.' })
  if (!note || note.length < 10) return res.status(400).json({ message: 'An approval rationale of at least 10 characters is required.' })

  let updated
  if (decision === 'APPROVE') {
    await prisma.application.updateMany({ where: { tenderId: application.tenderId, NOT: { id: application.id } }, data: { status: 'UNSUCCESSFUL' } })
    updated = await prisma.application.update({ where: { id: application.id }, data: { status: 'SUCCESSFUL', approvalNote: note } })
    await prisma.tender.update({ where: { id: application.tenderId }, data: { status: 'AWARDED' } })
    await addAudit(req.user!.name, 'Approved final award', application.tender.reference)
  } else if (decision === 'RETURN') {
    updated = await prisma.application.update({ where: { id: application.id }, data: { approvalNote: note } })
    await prisma.tender.update({ where: { id: application.tenderId }, data: { status: 'ADJUDICATION' } })
    await addAudit(req.user!.name, 'Returned award recommendation to BAC', application.tender.reference)
  } else if (decision === 'DECLINE') {
    await prisma.application.updateMany({ where: { tenderId: application.tenderId }, data: { status: 'UNSUCCESSFUL', approvalNote: note } })
    updated = await prisma.application.findUniqueOrThrow({ where: { id: application.id } })
    await prisma.tender.update({ where: { id: application.tenderId }, data: { status: 'CANCELLED' } })
    await addAudit(req.user!.name, 'Declined final award', application.tender.reference)
  } else {
    return res.status(400).json({ message: 'Invalid approval decision.' })
  }
  return res.json(toApplicationDTO(updated))
})

export default router
