import type { TenderRequirement } from '../types/models.js'

type RequirementSource = { requirements: Pick<TenderRequirement, 'id' | 'title' | 'mandatory'>[] }

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function requirementMatchesDocument(requirement: Pick<TenderRequirement, 'title'>, documentName: string) {
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

export function validateSubmittedDocuments(documents: string[], tender: RequirementSource) {
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

  const hasBlockingMandatoryIssue = missingMandatoryDocuments.length > 0
  const aiRecommendation = hasBlockingMandatoryIssue ? 'REJECTED' : score >= 70 ? 'QUALIFY' : 'REVIEW REQUIRED'

  return {
    validDocuments,
    rejectedDocuments,
    missingMandatoryDocuments,
    aiScore: score,
    aiRecommendation,
    aiSummary: hasBlockingMandatoryIssue
      ? `AI review accepted ${validDocuments.length} relevant document(s) but rejected this application: missing mandatory evidence — ${missingMandatoryDocuments.join(', ')}. The application does not qualify for committee evaluation and has been marked unsuccessful.`
      : validDocuments.length > 0
        ? `AI review accepted ${validDocuments.length} relevant document(s) for this tender and found the evidence sufficient for committee review.`
        : 'AI review rejected all submitted documents. No accepted evidence was found for this tender.',
  }
}

export function analyzeApplication(application: { documents: string[] }, tender: RequirementSource) {
  const validation = validateSubmittedDocuments(application.documents, tender)

  return {
    aiScore: validation.aiScore,
    aiRecommendation: validation.aiRecommendation,
    aiSummary: validation.aiSummary,
    validDocuments: validation.validDocuments,
    rejectedDocuments: validation.rejectedDocuments,
    missingMandatoryDocuments: validation.missingMandatoryDocuments,
  }
}
