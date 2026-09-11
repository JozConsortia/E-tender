import { Router } from 'express'
import { prisma } from '../prisma.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { toAlertDTO } from '../lib/serialize.js'

const router = Router()

router.get('/', authenticate, authorize('ADMIN'), async (req, res) => {
  const resolvedParam = req.query.resolved
  const where = resolvedParam === 'false' ? { resolved: false } : resolvedParam === 'true' ? { resolved: true } : {}
  const alerts = await prisma.securityAlert.findMany({ where, orderBy: { createdAt: 'desc' } })
  return res.json(alerts.map(toAlertDTO))
})

router.post('/:id/resolve', authenticate, authorize('ADMIN'), async (req, res) => {
  const alert = await prisma.securityAlert.findUnique({ where: { id: String(req.params.id) } })
  if (!alert) return res.status(404).json({ message: 'Alert not found.' })
  const updated = await prisma.securityAlert.update({
    where: { id: alert.id },
    data: { resolved: true, resolvedBy: req.user!.name, resolvedAt: new Date() },
  })
  return res.json(toAlertDTO(updated))
})

export default router
