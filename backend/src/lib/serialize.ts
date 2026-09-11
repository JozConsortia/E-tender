import type { Application, AuditLog, Tender, TenderRequirement, EvaluationCriterion, User } from '@prisma/client'
import type { ApplicationStatus, TenderStatus } from '../types/models.js'

export function parseJsonArray(value: string | null | undefined): string[] | undefined {
  if (!value) return undefined
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(String) : undefined
  } catch {
    return undefined
  }
}

export function toSafeUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organisation: user.organisation ?? undefined,
    directors: parseJsonArray(user.directors),
    verificationStatus: user.verificationStatus ?? undefined,
    verificationDocuments: parseJsonArray(user.verificationDocuments),
    verificationNote: user.verificationNote ?? undefined,
  }
}

type TenderWithRelations = Tender & {
  requirements: TenderRequirement[]
  criteria: EvaluationCriterion[]
  _count?: { applications: number }
}

export function toTenderDTO(tender: TenderWithRelations) {
  return {
    id: tender.id,
    reference: tender.reference,
    title: tender.title,
    department: tender.department,
    description: tender.description,
    closingDate: tender.closingDate.toISOString(),
    status: tender.status as TenderStatus,
    requirements: tender.requirements.map((r) => ({ id: r.id, title: r.title, mandatory: r.mandatory })),
    criteria: tender.criteria.map((c) => ({ id: c.id, title: c.title, weight: c.weight, maxScore: c.maxScore })),
    applications: tender._count?.applications ?? 0,
    publishedAt: tender.publishedAt?.toISOString(),
    createdBy: tender.createdById ?? undefined,
  }
}

export function toApplicationDTO(application: Application) {
  return {
    id: application.id,
    tenderId: application.tenderId,
    tenderReference: application.tenderReference,
    tenderTitle: application.tenderTitle,
    companyName: application.companyName,
    applicantId: application.applicantId,
    submittedAt: application.submittedAt.toISOString(),
    status: application.status as ApplicationStatus,
    bidSummary: application.bidSummary ?? undefined,
    technicalApproach: application.technicalApproach ?? undefined,
    deliveryTimeline: application.deliveryTimeline ?? undefined,
    pricingAmount: application.pricingAmount ?? undefined,
    complianceDeclaration: application.complianceDeclaration,
    documents: parseJsonArray(application.documents) ?? [],
    validDocuments: parseJsonArray(application.validDocuments),
    rejectedDocuments: parseJsonArray(application.rejectedDocuments),
    missingMandatoryDocuments: parseJsonArray(application.missingMandatoryDocuments),
    aiScore: application.aiScore ?? undefined,
    aiRecommendation: application.aiRecommendation ?? undefined,
    aiSummary: application.aiSummary ?? undefined,
    functionalityScore: application.functionalityScore ?? undefined,
    priceScore: application.priceScore ?? undefined,
    preferenceScore: application.preferenceScore ?? undefined,
    finalScore: application.finalScore ?? undefined,
    becNote: application.becNote ?? undefined,
    bacNote: application.bacNote ?? undefined,
    approvalNote: application.approvalNote ?? undefined,
  }
}

export function toAuditDTO(entry: AuditLog) {
  return {
    id: entry.id,
    time: entry.time,
    actor: entry.actor,
    action: entry.action,
    target: entry.target,
  }
}
