import { Router } from 'express'
import { applications, users, tenders } from '../data/store.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { addAudit, syncTenderLifecycle } from '../services/workflow.service.js'

const router = Router()
const validDoc = (name: string) => /\.(pdf|jpe?g|png)$/i.test(name)

router.get('/mine', authenticate, authorize('APPLICANT'), (req, res) => {
  syncTenderLifecycle()
  return res.json(applications.filter((item) => item.applicantId === req.user!.id))
})

router.post('/', authenticate, authorize('APPLICANT'), (req, res) => {
  syncTenderLifecycle()
  const { tenderId, companyName, documents } = req.body ?? {}
  const tender = tenders.find((item) => item.id === tenderId)
  if (!tender) return res.status(404).json({ message: 'Tender not found.' })
  if (tender.status !== 'PUBLISHED' || new Date(tender.closingDate).getTime() <= Date.now()) return res.status(400).json({ message: 'This tender is not open for applications.' })
  if (req.user!.verificationStatus !== 'APPROVED') return res.status(403).json({ message: 'Your company must be verified before you can apply.' })
  const organisation = req.user!.organisation ?? ''
  if (String(companyName).trim().toLowerCase() !== organisation.trim().toLowerCase()) return res.status(400).json({ message: 'Applications must use the verified company linked to the applicant account.' })
  const directors = req.user!.directors ?? []
  const staff = users.filter((u) => ['ADMIN', 'BEC', 'BAC', 'APPROVER', 'AUDITOR'].includes(u.role))
  if (directors.some((d) => staff.some((s) => s.name.toLowerCase() === d.toLowerCase()))) return res.status(403).json({ message: 'This company cannot apply because a staff member is registered as its director.' })
  if (!Array.isArray(documents) || !documents.length || !documents.every((d) => typeof d === 'string' && validDoc(d))) return res.status(400).json({ message: 'Attach valid supporting documents (PDF, JPG or PNG).' })
  const mandatoryCount = tender.requirements.filter((r) => r.mandatory).length
  if (documents.length < mandatoryCount) return res.status(400).json({ message: 'Attach a supporting document for every mandatory requirement.' })
  if (applications.some((item) => item.tenderId === tenderId && item.applicantId === req.user!.id)) return res.status(409).json({ message: 'You have already applied for this tender.' })
  const application = { id: `a-${Date.now()}`, tenderId: tender.id, tenderReference: tender.reference, tenderTitle: tender.title, companyName: organisation, applicantId: req.user!.id, submittedAt: new Date().toISOString(), status: 'SUBMITTED' as const, documents: documents.map(String) }
  applications.unshift(application)
  tender.applications += 1
  addAudit(req.user!.name, 'Submitted application', tender.reference)
  return res.status(201).json(application)
})

router.get('/all', authenticate, authorize('ADMIN', 'AUDITOR'), (req, res) => {
  syncTenderLifecycle()
  return res.json(applications)
})

export default router
