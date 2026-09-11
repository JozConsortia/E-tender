import type { Application, Tender } from '../types/models.js'

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function requirementMatchesDocument(requirement: Tender['requirements'][number], documentName: string) {
  const requirementText = normalize(requirement.title)
  const docText = normalize(documentName)
  const requirementWords = requirementText.split(/\s+/).filter(Boolean)
  const docWords = docText.split(/\s+/).filter(Boolean)

  if (!requirementWords.length || !docWords.length) return false

  const score = requirementWords.filter((word) => docWords.includes(word)).length
  const match = score >= Math.max(1, Math.ceil(requirementWords.length * 0.4))

  if (match) return true

  return requirementText.includes(docText) || docText.includes(requirementText)
}

export const MINIMUM_SUBMITTED_DOCUMENTS = 3

export function validateSubmittedDocuments(documents: string[], tender: Tender) {
  const validDocuments: string[] = []
  const rejectedDocuments: string[] = []
  const matchedRequirementIds = new Set<string>()

  for (const document of documents) {
    const match = tender.requirements.find((requirement) => requirementMatchesDocument(requirement, document))
    if (match) {
      validDocuments.push(document)
      matchedRequirementIds.add(match.id)
    } else {
      rejectedDocuments.push(document)
    }
  }

  const missingMandatoryDocuments = tender.requirements
    .filter((requirement) => requirement.mandatory && !matchedRequirementIds.has(requirement.id))
    .map((requirement) => requirement.title)

  const requiredCoverage = tender.requirements.filter((requirement) => requirement.mandatory).length
  const validCoverage = matchedRequirementIds.size
  const score = Math.min(100, Math.max(0, Math.round((validCoverage / Math.max(1, requiredCoverage)) * 100)))

  const hasInsufficientDocuments = documents.length < MINIMUM_SUBMITTED_DOCUMENTS
  const hasBlockingMandatoryIssue = missingMandatoryDocuments.length > 0
  const aiRecommendation = hasInsufficientDocuments ? 'REJECTED' : hasBlockingMandatoryIssue ? 'REVIEW REQUIRED' : score >= 70 ? 'QUALIFY' : 'REVIEW REQUIRED'

  return {
    validDocuments,
    rejectedDocuments,
    missingMandatoryDocuments,
    insufficientDocuments: hasInsufficientDocuments,
    aiScore: hasInsufficientDocuments ? 0 : score,
    aiRecommendation,
    aiSummary: hasInsufficientDocuments
      ? `AI review rejected the submission. Only ${documents.length} document(s) were attached and at least ${MINIMUM_SUBMITTED_DOCUMENTS} are required for a bid to be considered responsive.`
      : hasBlockingMandatoryIssue
        ? `AI review accepted ${validDocuments.length} relevant document(s). Missing mandatory evidence: ${missingMandatoryDocuments.join(', ')}. The application has been flagged for human review and should not be passed to BEC as a complete submission.`
        : validDocuments.length > 0
          ? `AI review accepted ${validDocuments.length} relevant document(s) for this tender and found the evidence sufficient for committee review.`
          : 'AI review rejected all submitted documents. No accepted evidence was found for this tender.',
  }
}

export function analyzeApplication(application: Application, tender: Tender) {
  const validation = validateSubmittedDocuments(application.documents, tender)

  return {
    aiScore: validation.aiScore,
    aiRecommendation: validation.aiRecommendation,
    aiSummary: validation.aiSummary,
    validDocuments: validation.validDocuments,
    rejectedDocuments: validation.rejectedDocuments,
    missingMandatoryDocuments: validation.missingMandatoryDocuments,
    insufficientDocuments: validation.insufficientDocuments,
  }
}
