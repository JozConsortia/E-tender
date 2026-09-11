export type Role = 'ADMIN' | 'APPLICANT' | 'BEC' | 'BAC' | 'APPROVER' | 'AUDITOR'
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type TenderStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'EVALUATION' | 'ADJUDICATION' | 'APPROVAL' | 'AWARDED' | 'CANCELLED'
export type ApplicationStatus = 'SUBMITTED' | 'UNDER_EVALUATION' | 'SHORTLISTED' | 'SUCCESSFUL' | 'UNSUCCESSFUL' | 'REVIEW_REQUIRED'

export interface TenderRequirement { id: string; title: string; mandatory: boolean }
export interface EvaluationCriterion { id: string; title: string; weight: number; maxScore: number }
