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

export interface SbdPerson {
  fullName: string
  idNumber: string
  taxRef: string
  stateEmployeeNumber: string
}

export interface Sbd4Form {
  fullName: string
  idNumber: string
  position: string
  companyRegNumber: string
  taxRefNumber: string
  vatRegNumber: string
  persons: SbdPerson[]
  employedByState: boolean | null
  conductedBusinessWithState: boolean | null
  relationshipWithStateEvaluator: boolean | null
  awareOfOtherBidderRelationship: boolean | null
  interestInOtherBidders: boolean | null
  declarationSignedBy: string
  declarationPosition: string
  declarationDate: string
  declarationCertified: boolean
}

export interface Sbd61Form {
  bbeeStatusLevel: string
  proofAttached: string
  pointsClaimed: string
  subcontracting: boolean | null
  companyName: string
  vatNumber: string
  companyRegNumber: string
  companyType: string
  companyClassification: string
  yearsInBusiness: string
  principalBusinessActivities: string
  certified: boolean
}

export interface Sbd62Form {
  hasImportedContent: boolean | null
  bidPriceExclVat: string
  importedContentRand: string
  declaredByName: string
  declaredByCapacity: string
  certified: boolean
}

export interface Sbd8Form {
  convictedFraudCorruption: boolean | null
  listedTenderDefaulters: boolean | null
  contractTerminatedPoorPerformance: boolean | null
  restrictedFromBidding: boolean | null
  details: string
  declaredByName: string
  declaredByPosition: string
  certified: boolean
}

export interface Sbd9Form {
  acknowledgeDisqualification: boolean
  authorisedToSign: boolean
  arrivedIndependently: boolean
  noConsultation: boolean
  termsNotDisclosed: boolean
  signedByName: string
  signedByPosition: string
  finalCertification: boolean
}

export interface SbdForm {
  companyPrice: {
    companyRegNumber: string
    vatNumber: string
  }
  specification: Record<string, string>
  signatureStyle?: number
  sbd4: Sbd4Form
  sbd61: Sbd61Form
  sbd62: Sbd62Form
  sbd8: Sbd8Form
  sbd9: Sbd9Form
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
  bidSummary?: string
  technicalApproach?: string
  deliveryTimeline?: string
  pricingAmount?: number
  complianceDeclaration?: boolean
  documents: string[]
  quotationDocuments?: string[]
  sbdForm?: SbdForm
  missingMandatoryDocuments?: string[]
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

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH'

export interface SecurityAlert {
  id: string
  type: string
  severity: AlertSeverity
  message: string
  targetType?: string
  targetId?: string
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: string
  createdAt: string
}
