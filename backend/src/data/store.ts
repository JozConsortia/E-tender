import type { Application, AuditEntry, EvaluationCriterion, Tender, TenderRequirement, User } from '../types/models.js'

export const users: User[] = [
  { id: 'u-admin', name: 'System Administrator', email: 'admin@etender.org', password: 'Admin123!', role: 'ADMIN' },
  { id: 'u-applicant', name: 'Thabo Mokoena', email: 'applicant@etender.org', password: 'Applicant123!', role: 'APPLICANT', organisation: 'Mokoena Digital Solutions', directors: ['Thabo Mokoena'], verificationStatus: 'APPROVED', verificationDocuments: ['Mokoena Company Registration.pdf', 'Mokoena Tax Compliance Certificate.pdf', 'Mokoena B-BBEE Certificate.pdf'] },
  { id: 'u-applicant-walkthrough', name: 'Sipho Dlamini', email: 'applicant.walkthrough@etender.org', password: 'Walkthrough123!', role: 'APPLICANT', organisation: 'Dlamini Digital Services', directors: ['Sipho Dlamini'], verificationStatus: 'APPROVED', verificationDocuments: ['Dlamini Company Registration.pdf', 'Dlamini Tax Compliance Certificate.pdf', 'Dlamini B-BBEE Certificate.pdf'] },
  { id: 'u-pending', name: 'Lerato Nkosi', email: 'supplier.pending@etender.org', password: 'Supplier123!', role: 'APPLICANT', organisation: 'Nkosi Enterprise Solutions', directors: ['Lerato Nkosi'], verificationStatus: 'PENDING', verificationDocuments: ['Nkosi Company Registration.pdf', 'Nkosi Tax Compliance Certificate.pdf', 'Nkosi B-BBEE Certificate.pdf'] },
  { id: 'u-bec', name: 'BEC Member', email: 'bec@etender.org', password: 'BEC123!', role: 'BEC' },
  { id: 'u-bac', name: 'BAC Member', email: 'bac@etender.org', password: 'BAC123!', role: 'BAC' },
  { id: 'u-approver', name: 'Final Approver', email: 'approver@etender.org', password: 'Approve123!', role: 'APPROVER' },
  { id: 'u-auditor', name: 'Internal Auditor', email: 'auditor@etender.org', password: 'Audit123!', role: 'AUDITOR' },
]

const req = (id: string, title: string, mandatory = true): TenderRequirement => ({ id, title, mandatory })
const criterion = (id: string, title: string, weight: number): EvaluationCriterion => ({ id, title, weight, maxScore: weight })

export const tenders: Tender[] = [
  {
    id: 't-001', reference: 'TND-2026-001', title: 'Supply and Installation of ICT Equipment', department: 'Information Technology',
    description: 'Supply, installation and support of desktop computers, networking equipment and peripherals.', closingDate: '2026-09-30T11:00:00', status: 'PUBLISHED',
    requirements: [req('r1', 'Company Registration'), req('r2', 'Tax Compliance Documentation'), req('r3', 'B-BBEE Documentation'), req('r4', 'Technical Proposal'), req('r5', 'Financial Proposal'), req('r6', 'Previous Relevant Experience')],
    criteria: [criterion('c1', 'Technical Capability', 40), criterion('c2', 'Price', 30), criterion('c3', 'Relevant Experience', 20), criterion('c4', 'Preference / Approved Criteria', 10)], applications: 1, publishedAt: '2026-09-01T09:00:00', createdBy: 'u-admin'
  },
  {
    id: 't-002', reference: 'TND-2026-002', title: 'Development of Municipal Citizen Portal', department: 'Digital Services',
    description: 'Design and implementation of a secure public-facing portal for municipal digital services.', closingDate: '2026-10-08T11:00:00', status: 'PUBLISHED',
    requirements: [req('r7', 'Company Registration'), req('r8', 'Tax Compliance Documentation'), req('r9', 'Technical Architecture Proposal'), req('r10', 'Development Portfolio'), req('r11', 'Financial Proposal')],
    criteria: [criterion('c5', 'Solution Architecture', 35), criterion('c6', 'Price', 30), criterion('c7', 'Experience', 25), criterion('c8', 'Preference / Approved Criteria', 10)], applications: 0, publishedAt: '2026-09-05T10:00:00', createdBy: 'u-admin'
  },
  {
    id: 't-003', reference: 'TND-2026-003', title: 'Network Infrastructure Upgrade', department: 'Infrastructure Services',
    description: 'Upgrade campus network switches, access points, cabling and network management equipment.', closingDate: '2026-08-28T11:00:00', status: 'EVALUATION',
    requirements: [req('r12', 'Company Registration'), req('r13', 'Tax Compliance Documentation'), req('r14', 'Network Technical Proposal'), req('r15', 'Cisco / Networking Certification Evidence'), req('r16', 'Financial Proposal')],
    criteria: [criterion('c9', 'Technical Capability', 40), criterion('c10', 'Price', 35), criterion('c11', 'Experience', 15), criterion('c12', 'Preference / Approved Criteria', 10)], applications: 1, publishedAt: '2026-08-01T09:00:00', createdBy: 'u-admin'
  },
  {
    id: 't-004', reference: 'TND-2026-004', title: 'Provincial Records Digitisation Services', department: 'Corporate Services',
    description: 'Digitisation, indexing and secure records management services for provincial departments.', closingDate: '2026-10-22T11:00:00', status: 'PUBLISHED',
    requirements: [req('r17', 'Company Registration'), req('r18', 'Tax Compliance Certificate'), req('r19', 'Digital Services Proposal'), req('r20', 'Information Security Evidence'), req('r21', 'Financial Proposal')],
    criteria: [criterion('c13', 'Technical Capability', 40), criterion('c14', 'Price', 30), criterion('c15', 'Relevant Experience', 20), criterion('c16', 'Preference / Approved Criteria', 10)], applications: 0, publishedAt: '2026-09-08T09:00:00', createdBy: 'u-admin'
  },
  {
    id: 't-005', reference: 'TND-2026-005', title: 'Supply Chain Compliance Review Services', department: 'Provincial Treasury',
    description: 'Independent review and improvement of supply chain compliance controls and reporting processes.', closingDate: '2026-08-20T11:00:00', status: 'ADJUDICATION',
    requirements: [req('r22', 'Company Registration'), req('r23', 'Tax Compliance Certificate'), req('r24', 'Compliance Methodology'), req('r25', 'Relevant Experience'), req('r26', 'Financial Proposal')],
    criteria: [criterion('c17', 'Compliance Capability', 40), criterion('c18', 'Price', 30), criterion('c19', 'Relevant Experience', 20), criterion('c20', 'Preference / Approved Criteria', 10)], applications: 1, publishedAt: '2026-07-20T09:00:00', createdBy: 'u-admin'
  },
]

export const applications: Application[] = [
  { id: 'a-001', tenderId: 't-001', tenderReference: 'TND-2026-001', tenderTitle: 'Supply and Installation of ICT Equipment', companyName: 'Mokoena Digital Solutions', applicantId: 'u-applicant', submittedAt: '2026-09-10T12:00:00', status: 'SUBMITTED', documents: ['Company Registration.pdf', 'Tax Compliance.pdf', 'B-BBEE.pdf', 'Technical Proposal.pdf', 'Financial Proposal.pdf', 'Experience.pdf'] },
  { id: 'a-002', tenderId: 't-003', tenderReference: 'TND-2026-003', tenderTitle: 'Network Infrastructure Upgrade', companyName: 'Mokoena Digital Solutions', applicantId: 'u-applicant', submittedAt: '2026-08-20T10:30:00', status: 'UNDER_EVALUATION', documents: ['Company Registration.pdf', 'Tax Compliance.pdf', 'Technical Proposal.pdf', 'Networking Certification.pdf', 'Financial Proposal.pdf'], aiScore: 88, aiRecommendation: 'QUALIFY', aiSummary: 'The AI identified all required document categories and found the technical submission broadly aligned with the published criteria. Human confirmation remains required.' },
  { id: 'a-003', tenderId: 't-005', tenderReference: 'TND-2026-005', tenderTitle: 'Supply Chain Compliance Review Services', companyName: 'Dlamini Digital Services', applicantId: 'u-applicant-walkthrough', submittedAt: '2026-08-10T10:15:00', status: 'SHORTLISTED', documents: ['Dlamini Company Registration.pdf', 'Dlamini Tax Compliance Certificate.pdf', 'Compliance Methodology.pdf', 'Relevant Experience.pdf', 'Financial Proposal.pdf'], aiScore: 82, aiRecommendation: 'QUALIFY', aiSummary: 'The AI identified the required compliance evidence and relevant public-sector experience. The submission remains subject to committee adjudication.', functionalityScore: 33, priceScore: 41, preferenceScore: 8, finalScore: 82, becNote: 'The BEC confirmed the evidence against the published criteria and recommends the bidder for adjudication.' },
]

export const auditLogs: AuditEntry[] = [
  { id: 'log-1', time: '2026-09-01 09:02', actor: 'System Administrator', action: 'Published tender', target: 'TND-2026-001' },
  { id: 'log-2', time: '2026-09-10 12:00', actor: 'Thabo Mokoena', action: 'Submitted application', target: 'TND-2026-001' },
  { id: 'log-3', time: '2026-08-29 08:00', actor: 'System', action: 'Moved tender to evaluation after closing', target: 'TND-2026-003' },
  { id: 'log-4', time: '2026-09-10 15:05', actor: 'BEC Member', action: 'AI-assisted evaluation ready for review', target: 'Application a-002' },
  { id: 'log-5', time: '2026-08-21 08:00', actor: 'System', action: 'Moved tender to adjudication after BEC completion', target: 'TND-2026-005' },
  { id: 'log-6', time: '2026-08-25 14:20', actor: 'BEC Member', action: 'Submitted BEC recommendation', target: 'Application a-003' },
]
