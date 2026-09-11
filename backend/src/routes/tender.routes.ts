import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { prisma } from '../prisma.js'
import { addAudit, syncTenderLifecycle } from '../services/workflow.service.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { toTenderDTO } from '../lib/serialize.js'

const router = Router()

const tenderInclude = {
  requirements: true,
  criteria: true,
  _count: { select: { applications: true } },
} as const

router.get('/', async (req, res) => {
  await syncTenderLifecycle()
  if (req.query.scope === 'all') {
    const header = req.header('authorization')
    if (!header) return res.status(401).json({ message: 'Authentication required.' })
    return authenticate(req, res, async () => {
      if (!req.user || !['ADMIN', 'AUDITOR'].includes(req.user.role)) return res.status(403).json({ message: 'Not authorised to view all tender records.' })
      const tenders = await prisma.tender.findMany({ include: tenderInclude, orderBy: { createdAt: 'desc' } })
      return res.json(tenders.map(toTenderDTO))
    })
  }
  const tenders = await prisma.tender.findMany({ where: { status: { in: ['PUBLISHED', 'AWARDED'] } }, include: tenderInclude, orderBy: { createdAt: 'desc' } })
  return res.json(tenders.map(toTenderDTO))
})

router.get('/:id', async (req, res) => {
  await syncTenderLifecycle()
  const tender = await prisma.tender.findUnique({ where: { id: String(req.params.id) }, include: tenderInclude })
  if (!tender) return res.status(404).json({ message: 'Tender not found.' })
  if (tender.status !== 'PUBLISHED' && tender.status !== 'AWARDED') {
    const header = req.header('authorization')
    if (!header) return res.status(404).json({ message: 'Tender not found.' })
    return authenticate(req, res, () => {
      if (req.user?.role === 'APPLICANT') return res.status(404).json({ message: 'Tender not found.' })
      return res.json(toTenderDTO(tender))
    })
  }
  return res.json(toTenderDTO(tender))
})

router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  const { title, department, description, closingDate, requirements, criteria } = req.body ?? {}
  const reqs = Array.isArray(requirements) ? requirements : []
  const criteriaList = Array.isArray(criteria) ? criteria : []
  const total = criteriaList.reduce((sum: number, item: { weight: unknown }) => sum + Number(item.weight), 0)
  if (!title || !department || !description || !closingDate || !reqs.length || !criteriaList.length || total !== 100) return res.status(400).json({ message: 'Provide valid tender details, requirements and criteria totalling 100%.' })
  if (new Date(closingDate).getTime() <= Date.now()) return res.status(400).json({ message: 'The closing date must be in the future.' })

  const existingReferences = await prisma.tender.findMany({ select: { reference: true } })
  const nextNumber = Math.max(0, ...existingReferences.map((t) => Number(t.reference.match(/(\d+)$/)?.[1] ?? 0))) + 1
  const reference = `TND-2026-${String(nextNumber).padStart(3, '0')}`

  const tender = await prisma.tender.create({
    data: {
      id: `t-${randomUUID()}`,
      reference,
      title: String(title).trim(),
      department: String(department).trim(),
      description: String(description).trim(),
      closingDate: new Date(closingDate),
      status: 'DRAFT',
      createdById: req.user!.id,
      requirements: { create: reqs.map((r: { title: unknown; mandatory: unknown }) => ({ id: `req-${randomUUID()}`, title: String(r.title), mandatory: Boolean(r.mandatory) })) },
      criteria: { create: criteriaList.map((c: { title: unknown; weight: unknown }) => ({ id: `crit-${randomUUID()}`, title: String(c.title), weight: Number(c.weight), maxScore: Number(c.weight) })) },
    },
    include: tenderInclude,
  })
  await addAudit(req.user!.name, 'Created tender', tender.reference)
  return res.status(201).json(toTenderDTO(tender))
})

router.post('/:id/publish', authenticate, authorize('ADMIN'), async (req, res) => {
  const tender = await prisma.tender.findUnique({ where: { id: String(req.params.id) } })
  if (!tender) return res.status(404).json({ message: 'Tender not found.' })
  if (tender.status !== 'DRAFT') return res.status(400).json({ message: 'Only draft tenders can be published.' })
  if (tender.closingDate.getTime() <= Date.now()) return res.status(400).json({ message: 'The closing date must be in the future.' })
  const updated = await prisma.tender.update({ where: { id: tender.id }, data: { status: 'PUBLISHED', publishedAt: new Date() }, include: tenderInclude })
  await addAudit(req.user!.name, 'Published tender', tender.reference)
  return res.json(toTenderDTO(updated))
})

router.post('/:id/advance', authenticate, authorize('ADMIN'), async (req, res) => {
  const tender = await prisma.tender.findUnique({ where: { id: String(req.params.id) } })
  if (!tender) return res.status(404).json({ message: 'Tender not found.' })

  const nextStatus = (() => {
    switch (tender.status) {
      case 'DRAFT': return 'PUBLISHED'
      case 'PUBLISHED': return 'EVALUATION'
      case 'EVALUATION': return 'ADJUDICATION'
      case 'ADJUDICATION': return 'APPROVAL'
      case 'APPROVAL': return 'AWARDED'
      default: return tender.status
    }
  })()

  if (nextStatus === tender.status) return res.status(400).json({ message: 'This tender is already at the final available demo stage.' })

  if (nextStatus === 'EVALUATION') {
    await prisma.application.updateMany({ where: { tenderId: tender.id, status: 'SUBMITTED' }, data: { status: 'UNDER_EVALUATION' } })
  }

  const updated = await prisma.tender.update({ where: { id: tender.id }, data: { status: nextStatus }, include: tenderInclude })
  await addAudit(req.user!.name, `Advanced tender to ${nextStatus}`, tender.reference)
  await syncTenderLifecycle()

  return res.json(toTenderDTO(updated))
})

export default router
