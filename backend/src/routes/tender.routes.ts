import { Router } from 'express'
import type { EvaluationCriterion, TenderRequirement } from '../types/models.js'
import { applications, tenders } from '../data/store.js'
import { addAudit, syncTenderLifecycle } from '../services/workflow.service.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

// Requirements and criteria may arrive as plain strings from API clients, so
// they are normalised into the stored shape before the tender is created.
function normaliseRequirements(input: unknown): TenderRequirement[] {
  if (!Array.isArray(input)) return []
  return input
    .map((item, index) => {
      const source = typeof item === 'string' ? { title: item } : (item as Partial<TenderRequirement> | null)
      const title = String(source?.title ?? '').trim()
      if (!title) return null
      return { id: String(source?.id ?? `req-${index}`), title, mandatory: source?.mandatory !== false }
    })
    .filter((item): item is TenderRequirement => item !== null)
}

function normaliseCriteria(input: unknown): EvaluationCriterion[] {
  if (!Array.isArray(input)) return []
  return input
    .map((item, index) => {
      const source = item as (Partial<EvaluationCriterion> & { name?: string }) | null
      const title = String(source?.title ?? source?.name ?? '').trim()
      const weight = Number(source?.weight)
      if (!title || !Number.isFinite(weight)) return null
      return { id: String(source?.id ?? `crit-${index}`), title, weight, maxScore: Number(source?.maxScore ?? weight) }
    })
    .filter((item): item is EvaluationCriterion => item !== null)
}

router.get('/', (req, res) => {
  syncTenderLifecycle()
  if (req.query.scope === 'all') {
    const header = req.header('authorization')
    if (!header) return res.status(401).json({ message: 'Authentication required.' })
    return authenticate(req, res, () => {
      if (!req.user || !['ADMIN', 'AUDITOR'].includes(req.user.role)) return res.status(403).json({ message: 'Not authorised to view all tender records.' })
      return res.json(tenders)
    })
  }
  return res.json(tenders.filter((t) => t.status === 'PUBLISHED' || t.status === 'AWARDED'))
})

router.get('/:id', (req, res) => {
  syncTenderLifecycle()
  const tender = tenders.find((item) => item.id === req.params.id)
  if (!tender) return res.status(404).json({ message: 'Tender not found.' })
  if (tender.status !== 'PUBLISHED' && tender.status !== 'AWARDED') {
    const header = req.header('authorization')
    if (!header) return res.status(404).json({ message: 'Tender not found.' })
    return authenticate(req, res, () => {
      if (req.user?.role === 'APPLICANT') return res.status(404).json({ message: 'Tender not found.' })
      return res.json(tender)
    })
  }
  return res.json(tender)
})

router.post('/', authenticate, authorize('ADMIN'), (req, res) => {
  const { title, department, description, closingDate, requirements, criteria } = req.body ?? {}
  const reqs = normaliseRequirements(requirements)
  const criteriaList = normaliseCriteria(criteria)
  const total = criteriaList.reduce((sum, item) => sum + Number(item.weight), 0)
  if (!title || !department || !description || !closingDate || !reqs.length || !criteriaList.length || total !== 100) return res.status(400).json({ message: 'Provide valid tender details, requirements and criteria totalling 100%.' })
  if (new Date(closingDate).getTime() <= Date.now()) return res.status(400).json({ message: 'The closing date must be in the future.' })
  const nextNumber = Math.max(0, ...tenders.map((t) => Number(t.reference.match(/(\d+)$/)?.[1] ?? 0))) + 1
  const tender = { id: `t-${Date.now()}`, reference: `TND-2026-${String(nextNumber).padStart(3, '0')}`, title: String(title).trim(), department: String(department).trim(), description: String(description).trim(), closingDate: String(closingDate), status: 'DRAFT' as const, requirements: reqs, criteria: criteriaList, applications: 0, createdBy: req.user!.id }
  tenders.unshift(tender)
  addAudit(req.user!.name, 'Created tender', tender.reference)
  return res.status(201).json(tender)
})

router.post('/:id/publish', authenticate, authorize('ADMIN'), (req, res) => {
  const tender = tenders.find((item) => item.id === req.params.id)
  if (!tender) return res.status(404).json({ message: 'Tender not found.' })
  if (tender.status !== 'DRAFT') return res.status(400).json({ message: 'Only draft tenders can be published.' })
  if (new Date(tender.closingDate).getTime() <= Date.now()) return res.status(400).json({ message: 'The closing date must be in the future.' })
  tender.status = 'PUBLISHED'
  tender.publishedAt = new Date().toISOString()
  addAudit(req.user!.name, 'Published tender', tender.reference)
  return res.json(tender)
})

router.post('/:id/advance', authenticate, authorize('ADMIN'), (req, res) => {
  const tender = tenders.find((item) => item.id === req.params.id)
  if (!tender) return res.status(404).json({ message: 'Tender not found.' })

  const nextStatus = (() => {
    switch (tender.status) {
      case 'DRAFT':
        return 'PUBLISHED'
      case 'PUBLISHED':
        return 'EVALUATION'
      case 'EVALUATION':
        return 'ADJUDICATION'
      case 'ADJUDICATION':
        return 'APPROVAL'
      case 'APPROVAL':
        return 'AWARDED'
      default:
        return tender.status
    }
  })()

  if (nextStatus === tender.status) {
    return res.status(400).json({ message: 'This tender is already at the final available demo stage.' })
  }

  tender.status = nextStatus
  if (nextStatus === 'EVALUATION') {
    for (const application of applications.filter((item) => item.tenderId === tender.id && item.status === 'SUBMITTED')) application.status = 'UNDER_EVALUATION'
  }
  addAudit(req.user!.name, `Advanced tender to ${nextStatus}`, tender.reference)
  syncTenderLifecycle()

  return res.json(tender)
})

export default router
