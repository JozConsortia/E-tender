import { Router } from 'express'
import authRoutes from './auth.routes.js'
import tenderRoutes from './tender.routes.js'
import applicationRoutes from './application.routes.js'
import staffRoutes from './staff.routes.js'
import documentRoutes from './documentRoutes.js'
import { prisma } from '../prisma.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { syncTenderLifecycle } from '../services/workflow.service.js'
import { toApplicationDTO, toAuditDTO, toSafeUser, toTenderDTO } from '../lib/serialize.js'

const router = Router()

const tenderInclude = { requirements: true, criteria: true, _count: { select: { applications: true } } } as const
const applicationInclude = { tender: true } as const

router.get('/health', (_req, res) => res.json({ status: 'ok', database: 'mysql', storage: 'prisma' }))
router.post('/demo/reset', (_req, res) => {
  return res.json({ message: 'Run `npm run db:seed` in the backend to restore the seed data.' })
})

router.get('/bootstrap', authenticate, async (req, res) => {
  await syncTenderLifecycle()
  const role = req.user!.role

  if (role === 'APPLICANT') {
    const [tenders, applications] = await Promise.all([
      prisma.tender.findMany({ where: { status: { in: ['PUBLISHED', 'AWARDED'] } }, include: tenderInclude }),
      prisma.application.findMany({ where: { applicantId: req.user!.id }, include: applicationInclude }),
    ])
    return res.json({ users: [toSafeUser(req.user!)], tenders: tenders.map(toTenderDTO), applications: applications.map(toApplicationDTO), auditLogs: [] })
  }

  if (role === 'BEC') {
    const tenders = await prisma.tender.findMany({ where: { status: 'EVALUATION' }, include: tenderInclude })
    const applications = await prisma.application.findMany({ where: { tenderId: { in: tenders.map((t) => t.id) } }, include: applicationInclude })
    return res.json({ users: [], tenders: tenders.map(toTenderDTO), applications: applications.map(toApplicationDTO), auditLogs: [] })
  }

  if (role === 'BAC') {
    const tenders = await prisma.tender.findMany({ where: { status: 'ADJUDICATION' }, include: tenderInclude })
    const applications = await prisma.application.findMany({ where: { tenderId: { in: tenders.map((t) => t.id) }, status: 'SHORTLISTED' }, include: applicationInclude })
    return res.json({ users: [], tenders: tenders.map(toTenderDTO), applications: applications.map(toApplicationDTO), auditLogs: [] })
  }

  if (role === 'APPROVER') {
    const tenders = await prisma.tender.findMany({ where: { status: { in: ['APPROVAL', 'AWARDED'] } }, include: tenderInclude })
    const applications = await prisma.application.findMany({ where: { tenderId: { in: tenders.map((t) => t.id) } }, include: applicationInclude })
    return res.json({ users: [], tenders: tenders.map(toTenderDTO), applications: applications.map(toApplicationDTO), auditLogs: [] })
  }

  const [users, tenders, applications, auditLogs] = await Promise.all([
    prisma.user.findMany(),
    prisma.tender.findMany({ include: tenderInclude }),
    prisma.application.findMany({ include: applicationInclude }),
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' } }),
  ])
  return res.json({ users: users.map(toSafeUser), tenders: tenders.map(toTenderDTO), applications: applications.map(toApplicationDTO), auditLogs: auditLogs.map(toAuditDTO) })
})

router.use('/auth', authRoutes)
router.use('/tenders', tenderRoutes)
router.use('/applications', applicationRoutes)
router.use('/', staffRoutes)
router.use('/documents', authenticate, authorize('ADMIN'), documentRoutes)

export default router
