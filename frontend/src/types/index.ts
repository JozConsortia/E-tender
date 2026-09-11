export type Role =
  | 'ADMIN'
  | 'APPLICANT'
  | 'BEC'
  | 'BAC'
  | 'APPROVER'
  | 'AUDITOR'

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type TenderStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'CLOSED'
  | 'EVALUATION'
  | 'ADJUDICATION'
  | 'APPROVAL'
  | 'AWARDED'
  | 'CANCELLED'

export type ApplicationStatus =
  | 'SUBMITTED'
  | 'UNDER_EVALUATION'
  | 'SHORTLISTED'
  | 'SUCCESSFUL'
  | 'UNSUCCESSFUL'
  | 'REVIEW_REQUIRED'

export interface DemoUser {
  id: string
  name: string
  email: string
  password: string
  role: Role
  organisation?: string
  directors?: string[]
  verificationStatus?: VerificationStatus
  verificationDocuments?: string[]
  verificationNote?: string
}

export interface TenderRequirement {
  id: string
  title: string
  mandatory: boolean
}

export interface EvaluationCriterion {
  id: string
  title: string
  weight: number
  maxScore: number
}

export interface Tender {
  id: string
  reference: string
  title: string
  department: string
  description: string
  closingDate: string
  status: TenderStatus
  requirements: TenderRequirement[]
  criteria: EvaluationCriterion[]
  applications: number
  publishedAt?: string
  createdBy: string
}

export interface Application {
  id: string
  tenderId: string
  tenderReference: string
  tenderTitle: string
  companyName: string
  applicantId: string
  submittedAt: string
  status: ApplicationStatus
  documents: string[]
  aiScore?: number
  aiRecommendation?: string
  aiSummary?: string
  functionalityScore?: number
  priceScore?: number
  preferenceScore?: number
  finalScore?: number
  becNote?: string
  bacNote?: string
  approvalNote?: string
}

export interface AuditEntry {
  id: string
  time: string
  actor: string
  action: string
  target: string
}
