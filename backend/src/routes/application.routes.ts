import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { prisma } from '../prisma.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { validateSubmittedDocuments } from '../services/ai.service.js'
import { addAudit, syncTenderLifecycle } from '../services/workflow.service.js'
import { raiseAlert } from '../services/alert.service.js'
import { parseJsonArray, toApplicationDTO } from '../lib/serialize.js'

const router = Router()
const validDoc = (name: string) => /\.(pdf|jpe?g|png)$/i.test(name)

router.get('/mine', authenticate, authorize('APPLICANT'), async (req, res) => {
  await syncTenderLifecycle()
  const applications = await prisma.application.findMany({ where: { applicantId: req.user!.id }, orderBy: { submittedAt: 'desc' } })
  return res.json(applications.map(toApplicationDTO))
})

router.post('/', authenticate, authorize('APPLICANT'), async (req, res) => {
  await syncTenderLifecycle()
  const { tenderId, companyName, documents, bidSummary, technicalApproach, deliveryTimeline, pricingAmount, complianceDeclaration, quotationDocuments, sbdForm } = req.body ?? {}
  const tender = await prisma.tender.findUnique({ where: { id: tenderId }, include: { requirements: true } })
  if (!tender) return res.status(404).json({ message: 'Tender not found.' })
  if (tender.status !== 'PUBLISHED' || tender.closingDate.getTime() <= Date.now()) return res.status(400).json({ message: 'This tender is not open for applications.' })
  if (req.user!.verificationStatus !== 'APPROVED') return res.status(403).json({ message: 'Your company must be verified before you can apply.' })

  const organisation = req.user!.organisation ?? ''
  if (String(companyName).trim().toLowerCase() !== organisation.trim().toLowerCase()) return res.status(400).json({ message: 'Applications must use the verified company linked to the applicant account.' })

  const directors = parseJsonArray(req.user!.directors) ?? []
  const staff = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'BEC', 'BAC', 'APPROVER', 'AUDITOR'] } } })
  if (directors.some((d) => staff.some((s) => s.name.toLowerCase() === d.toLowerCase()))) {
    await raiseAlert({
      type: 'DIRECTOR_CONFLICT',
      severity: 'HIGH',
      message: `"${organisation}" attempted to apply for ${tender.reference} while a declared director matches an internal staff account.`,
      targetType: 'user',
      targetId: req.user!.id,
    })
    return res.status(403).json({ message: 'This company cannot apply because a staff member is registered as its director.' })
  }

  if (!Array.isArray(documents) || !documents.length || !documents.every((d: unknown) => typeof d === 'string' && validDoc(d))) return res.status(400).json({ message: 'Attach valid supporting documents (PDF, JPG or PNG).' })

  if (!String(bidSummary ?? '').trim() || String(bidSummary).trim().length < 20) return res.status(400).json({ message: 'Provide a bid summary of at least 20 characters.' })
  if (!String(technicalApproach ?? '').trim() || String(technicalApproach).trim().length < 20) return res.status(400).json({ message: 'Provide a technical approach of at least 20 characters.' })
  if (!String(deliveryTimeline ?? '').trim()) return res.status(400).json({ message: 'Provide a delivery timeline.' })
  const price = Number(pricingAmount)
  if (!Number.isFinite(price) || price <= 0) return res.status(400).json({ message: 'Provide a valid pricing amount.' })
  if (complianceDeclaration !== true) return res.status(400).json({ message: 'You must declare compliance with the tender terms to submit.' })

  if (quotationDocuments !== undefined && (!Array.isArray(quotationDocuments) || !quotationDocuments.every((d: unknown) => typeof d === 'string'))) {
    return res.status(400).json({ message: 'Quotation documents must be a list of file names.' })
  }

  if (!sbdForm || typeof sbdForm !== 'object') return res.status(400).json({ message: 'The SBD bid documents (SBD4, SBD6.1, SBD6.2, SBD8, SBD9) must be completed before submitting.' })
  if (sbdForm.sbd4?.declarationCertified !== true) return res.status(400).json({ message: 'SBD4 (Declaration of Interest) must be certified before submitting.' })
  if (sbdForm.sbd61?.certified !== true) return res.status(400).json({ message: 'SBD6.1 (Preference Points Claim) must be certified before submitting.' })
  if (sbdForm.sbd62?.certified !== true) return res.status(400).json({ message: 'SBD6.2 (Local Production and Content) must be certified before submitting.' })
  if (sbdForm.sbd8?.certified !== true) return res.status(400).json({ message: 'SBD8 (Declaration of Bidder\'s Past Supply Chain Practices) must be certified before submitting.' })
  const sbd9 = sbdForm.sbd9 ?? {}
  if (!sbd9.acknowledgeDisqualification || !sbd9.authorisedToSign || !sbd9.arrivedIndependently || !sbd9.noConsultation || !sbd9.termsNotDisclosed || !sbd9.finalCertification) {
    return res.status(400).json({ message: 'SBD9 (Certificate of Independent Bid Determination) must be fully certified before submitting.' })
  }

  const existing = await prisma.application.findFirst({ where: { tenderId: tender.id, applicantId: req.user!.id } })
  if (existing) return res.status(409).json({ message: 'You have already applied for this tender.' })

  const submittedNames = documents.map(String)
  const otherApplications = await prisma.application.findMany({ where: { applicantId: { not: req.user!.id } }, select: { documents: true, companyName: true } })
  for (const other of otherApplications) {
    const otherNames = new Set(parseJsonArray(other.documents) ?? [])
    const overlap = submittedNames.filter((name) => otherNames.has(name))
    if (overlap.length) {
      await raiseAlert({
        type: 'DUPLICATE_DOCUMENTS',
        severity: 'MEDIUM',
        message: `"${organisation}" submitted document(s) identical in filename to a submission from "${other.companyName}": ${overlap.join(', ')}. Evidence should be checked for reuse or fabrication.`,
        targetType: 'user',
        targetId: req.user!.id,
      })
      break
    }
  }

  const validation = validateSubmittedDocuments(documents.map(String), tender)
  const canProceedToBec = validation.missingMandatoryDocuments.length === 0 && validation.validDocuments.length > 0

  const application = await prisma.application.create({
    data: {
      id: `a-${randomUUID()}`,
      tenderId: tender.id,
      tenderReference: tender.reference,
      tenderTitle: tender.title,
      applicantId: req.user!.id,
      companyName: organisation,
      status: canProceedToBec ? 'SUBMITTED' : 'UNSUCCESSFUL',
      bidSummary: String(bidSummary).trim(),
      technicalApproach: String(technicalApproach).trim(),
      deliveryTimeline: String(deliveryTimeline).trim(),
      pricingAmount: price,
      complianceDeclaration: true,
      documents: JSON.stringify(documents.map(String)),
      quotationDocuments: JSON.stringify(Array.isArray(quotationDocuments) ? quotationDocuments.map(String) : []),
      sbdForm: JSON.stringify(sbdForm),
      validDocuments: JSON.stringify(validation.validDocuments),
      rejectedDocuments: JSON.stringify(validation.rejectedDocuments),
      missingMandatoryDocuments: JSON.stringify(validation.missingMandatoryDocuments),
      aiScore: validation.aiScore,
      aiRecommendation: validation.aiRecommendation,
      aiSummary: validation.aiSummary,
      approvalNote: canProceedToBec ? null : `Automatically rejected by AI document screening: missing mandatory evidence — ${validation.missingMandatoryDocuments.join(', ')}.`,
      updatedAt: new Date(),
    },
  })
  await addAudit(req.user!.name, canProceedToBec ? 'Submitted application for review' : 'Application automatically rejected by AI document screening', tender.reference)
  return res.status(201).json(toApplicationDTO(application))
})

router.get('/all', authenticate, authorize('ADMIN', 'AUDITOR'), async (_req, res) => {
  await syncTenderLifecycle()
  const applications = await prisma.application.findMany({ orderBy: { submittedAt: 'desc' } })
  return res.json(applications.map(toApplicationDTO))
})

export default router
