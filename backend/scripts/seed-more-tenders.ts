import { prisma } from '../src/prisma.js'

const ADMIN = 'u-admin'
const APPLICANT = 'u-applicant' // Mokoena Digital Solutions
const WALKTHROUGH = 'u-applicant-walkthrough' // Dlamini Digital Services
const KHUMALO = 'u-applicant-khumalo' // Mpumalanga Infrastructure & Engineering Services

const past = (days: number) => new Date(Date.now() - days * 86400000)
const future = (days: number) => new Date(Date.now() + days * 86400000)

async function main() {
  const existing = await prisma.tender.findUnique({ where: { reference: 'MPG/AGR/2026/007' } })
  if (existing) {
    console.log('Demo tenders 007-012 already exist — skipping (safe to re-run).')
    return
  }

  // 7. DRAFT — admin can publish this live during a demo
  await prisma.tender.create({
    data: {
      reference: 'MPG/AGR/2026/007',
      title: 'Supply of Agricultural Equipment and Farmer Support Tools',
      department: 'Department of Agriculture, Rural Development, Land and Environmental Affairs',
      description: 'Supply of tractors, irrigation equipment and hand tools to support emerging farmer development programmes across the province.',
      closingDate: future(30),
      status: 'DRAFT',
      createdById: ADMIN,
      requirements: { create: [
        { title: 'CIPC Company Registration', mandatory: true },
        { title: 'SARS Tax Compliance PIN', mandatory: true },
        { title: 'Equipment Supply and Warranty Proposal', mandatory: true },
        { title: 'B-BBEE Certificate', mandatory: false },
      ] },
      criteria: { create: [
        { title: 'Technical Capability', weight: 40, maxScore: 40 },
        { title: 'Price', weight: 40, maxScore: 40 },
        { title: 'Preference / Approved Criteria', weight: 20, maxScore: 20 },
      ] },
    },
  })

  // 8. EVALUATION — one application UNDER_EVALUATION, ready for BEC to score live
  const t008 = await prisma.tender.create({
    data: {
      reference: 'MPG/HLTH/2026/008',
      title: 'Provincial Clinics Medical Consumables Supply Contract',
      department: 'Department of Health & Social Development',
      description: 'Twelve-month supply contract for essential medical consumables to provincial primary healthcare clinics.',
      closingDate: past(5),
      status: 'EVALUATION',
      publishedAt: past(35),
      createdById: ADMIN,
      requirements: { create: [
        { title: 'CIPC Company Registration', mandatory: true },
        { title: 'SARS Tax Compliance PIN', mandatory: true },
        { title: 'SAHPRA Distribution License', mandatory: true },
        { title: 'Financial Proposal', mandatory: true },
      ] },
      criteria: { create: [
        { title: 'Technical Capability', weight: 35, maxScore: 35 },
        { title: 'Price', weight: 40, maxScore: 40 },
        { title: 'Experience', weight: 15, maxScore: 15 },
        { title: 'Preference / Approved Criteria', weight: 10, maxScore: 10 },
      ] },
    },
  })
  await prisma.application.create({
    data: {
      tenderId: t008.id,
      tenderReference: t008.reference,
      tenderTitle: t008.title,
      applicantId: KHUMALO,
      companyName: 'Mpumalanga Infrastructure & Engineering Services (Pty) Ltd',
      submittedAt: past(10),
      status: 'UNDER_EVALUATION',
      bidSummary: 'We propose a reliable 12-month medical consumables supply chain with a licensed distribution network already covering four provincial districts.',
      technicalApproach: 'Consumables are sourced from SAHPRA-approved manufacturers and distributed via our existing cold-chain-compliant logistics fleet, with weekly clinic-level replenishment.',
      deliveryTimeline: 'Rolling weekly delivery over a 12-month contract term',
      pricingAmount: 3200000,
      complianceDeclaration: true,
      documents: JSON.stringify(['CIPC Company Registration.pdf', 'SARS Tax Compliance PIN.pdf', 'SAHPRA Distribution License.pdf', 'Financial Proposal.pdf']),
      validDocuments: JSON.stringify(['CIPC Company Registration.pdf', 'SARS Tax Compliance PIN.pdf', 'SAHPRA Distribution License.pdf', 'Financial Proposal.pdf']),
      rejectedDocuments: JSON.stringify([]),
      missingMandatoryDocuments: JSON.stringify([]),
      aiScore: 84,
      aiRecommendation: 'QUALIFY',
      aiSummary: 'AI review confirmed all mandatory statutory and regulatory documentation, including a valid SAHPRA distribution license.',
    },
  })

  // 9. ADJUDICATION — one application SHORTLISTED, ready for BAC to adjudicate
  const t009 = await prisma.tender.create({
    data: {
      reference: 'MPG/RDS/2026/009',
      title: 'Rural Roads Rehabilitation and Maintenance Services',
      department: 'Department of Public Works, Roads and Transport',
      description: 'Rehabilitation and ongoing maintenance of provincial rural access roads across three districts.',
      closingDate: past(12),
      status: 'ADJUDICATION',
      publishedAt: past(42),
      createdById: ADMIN,
      requirements: { create: [
        { title: 'CIPC Company Registration', mandatory: true },
        { title: 'SARS Tax Compliance PIN', mandatory: true },
        { title: 'CIDB Grade 6 Civil Engineering Certificate', mandatory: true },
        { title: 'Method Statement and Programme', mandatory: true },
        { title: 'Financial Proposal', mandatory: true },
      ] },
      criteria: { create: [
        { title: 'Technical Capability', weight: 40, maxScore: 40 },
        { title: 'Price', weight: 35, maxScore: 35 },
        { title: 'Experience', weight: 15, maxScore: 15 },
        { title: 'Preference / Approved Criteria', weight: 10, maxScore: 10 },
      ] },
    },
  })
  await prisma.application.create({
    data: {
      tenderId: t009.id,
      tenderReference: t009.reference,
      tenderTitle: t009.title,
      applicantId: WALKTHROUGH,
      companyName: 'Dlamini Digital Services (Pty) Ltd',
      submittedAt: past(20),
      status: 'SHORTLISTED',
      bidSummary: 'Our civil engineering division proposes a phased rehabilitation programme prioritising the highest-risk rural access routes first.',
      technicalApproach: 'Work follows SANRAL-aligned resurfacing methodology with local labour sourcing for the maintenance phase, supervised by our CIDB Grade 6 certified engineering team.',
      deliveryTimeline: '18-month rehabilitation phase followed by a 24-month maintenance term',
      pricingAmount: 18500000,
      complianceDeclaration: true,
      documents: JSON.stringify(['CIPC Company Registration.pdf', 'SARS Tax Compliance PIN.pdf', 'CIDB Grade 6 Certificate.pdf', 'Method Statement.pdf', 'Financial Proposal.pdf']),
      validDocuments: JSON.stringify(['CIPC Company Registration.pdf', 'SARS Tax Compliance PIN.pdf', 'CIDB Grade 6 Certificate.pdf', 'Method Statement.pdf', 'Financial Proposal.pdf']),
      rejectedDocuments: JSON.stringify([]),
      missingMandatoryDocuments: JSON.stringify([]),
      aiScore: 89,
      aiRecommendation: 'QUALIFY',
      aiSummary: 'AI review confirmed CIDB grading evidence and a complete statutory document set.',
      functionalityScore: 36,
      priceScore: 30,
      preferenceScore: 9,
      finalScore: 88,
      becNote: 'The committee confirmed CIDB Grade 6 standing and found the phased methodology sound. Recommended for adjudication.',
    },
  })

  // 10. APPROVAL — one application SHORTLISTED with a BAC note, awaiting the Approver
  const t010 = await prisma.tender.create({
    data: {
      reference: 'MPG/SAFE/2026/010',
      title: 'Provincial Disaster Management Equipment Supply',
      department: 'Department of Community Safety, Security and Liaison',
      description: 'Supply of emergency response vehicles, rescue equipment and disaster relief supplies for the Provincial Disaster Management Centre.',
      closingDate: past(18),
      status: 'APPROVAL',
      publishedAt: past(48),
      createdById: ADMIN,
      requirements: { create: [
        { title: 'CIPC Company Registration', mandatory: true },
        { title: 'SARS Tax Compliance PIN', mandatory: true },
        { title: 'Equipment Specification Compliance Sheet', mandatory: true },
        { title: 'Financial Proposal', mandatory: true },
      ] },
      criteria: { create: [
        { title: 'Technical Capability', weight: 40, maxScore: 40 },
        { title: 'Price', weight: 35, maxScore: 35 },
        { title: 'Experience', weight: 15, maxScore: 15 },
        { title: 'Preference / Approved Criteria', weight: 10, maxScore: 10 },
      ] },
    },
  })
  await prisma.application.create({
    data: {
      tenderId: t010.id,
      tenderReference: t010.reference,
      tenderTitle: t010.title,
      applicantId: APPLICANT,
      companyName: 'Mokoena Digital Solutions (Pty) Ltd',
      submittedAt: past(28),
      status: 'SHORTLISTED',
      bidSummary: 'We propose supply of fully equipped emergency response vehicles and rescue equipment meeting the published specification sheet in full.',
      technicalApproach: 'All equipment is sourced from OEM-authorised partners with a 5-year maintenance and parts-availability guarantee included in the price.',
      deliveryTimeline: '10 weeks from award for the first tranche, full delivery within 16 weeks',
      pricingAmount: 6400000,
      complianceDeclaration: true,
      documents: JSON.stringify(['CIPC Company Registration.pdf', 'SARS Tax Compliance PIN.pdf', 'Equipment Specification Compliance Sheet.pdf', 'Financial Proposal.pdf']),
      validDocuments: JSON.stringify(['CIPC Company Registration.pdf', 'SARS Tax Compliance PIN.pdf', 'Equipment Specification Compliance Sheet.pdf', 'Financial Proposal.pdf']),
      rejectedDocuments: JSON.stringify([]),
      missingMandatoryDocuments: JSON.stringify([]),
      aiScore: 91,
      aiRecommendation: 'QUALIFY',
      aiSummary: 'AI review confirmed full specification compliance evidence and a complete statutory document set.',
      functionalityScore: 37,
      priceScore: 32,
      preferenceScore: 9,
      finalScore: 90,
      becNote: 'Equipment specifications fully match the published requirement. Strong recommendation for adjudication.',
      bacNote: 'BAC confirmed the OEM partnership evidence and 5-year maintenance guarantee. Referred for final approval.',
    },
  })

  // 11. AWARDED — one SUCCESSFUL, one UNSUCCESSFUL
  const t011 = await prisma.tender.create({
    data: {
      reference: 'MPG/SPORT/2026/011',
      title: 'Sports and Recreation Facility Upgrades',
      department: 'Department of Culture, Sport and Recreation',
      description: 'Upgrade of provincial sports fields, ablution facilities and floodlighting at five community sports grounds.',
      closingDate: past(40),
      status: 'AWARDED',
      publishedAt: past(70),
      createdById: ADMIN,
      requirements: { create: [
        { title: 'CIPC Company Registration', mandatory: true },
        { title: 'SARS Tax Compliance PIN', mandatory: true },
        { title: 'CIDB Grade 4 Building Certificate', mandatory: true },
        { title: 'Financial Proposal', mandatory: true },
      ] },
      criteria: { create: [
        { title: 'Technical Capability', weight: 35, maxScore: 35 },
        { title: 'Price', weight: 40, maxScore: 40 },
        { title: 'Experience', weight: 15, maxScore: 15 },
        { title: 'Preference / Approved Criteria', weight: 10, maxScore: 10 },
      ] },
    },
  })
  await prisma.application.create({
    data: {
      tenderId: t011.id,
      tenderReference: t011.reference,
      tenderTitle: t011.title,
      applicantId: WALKTHROUGH,
      companyName: 'Dlamini Digital Services (Pty) Ltd',
      submittedAt: past(55),
      status: 'SUCCESSFUL',
      bidSummary: 'We propose a full upgrade of all five sports grounds within a single mobilised construction programme to minimise community disruption.',
      technicalApproach: 'Works are sequenced one facility at a time using our CIDB Grade 4 accredited building team, with floodlighting installed by a licensed electrical subcontractor.',
      deliveryTimeline: '9 months across all five sites',
      pricingAmount: 9800000,
      complianceDeclaration: true,
      documents: JSON.stringify(['CIPC Company Registration.pdf', 'SARS Tax Compliance PIN.pdf', 'CIDB Grade 4 Certificate.pdf', 'Financial Proposal.pdf']),
      validDocuments: JSON.stringify(['CIPC Company Registration.pdf', 'SARS Tax Compliance PIN.pdf', 'CIDB Grade 4 Certificate.pdf', 'Financial Proposal.pdf']),
      rejectedDocuments: JSON.stringify([]),
      missingMandatoryDocuments: JSON.stringify([]),
      aiScore: 87,
      aiRecommendation: 'QUALIFY',
      aiSummary: 'AI review confirmed CIDB grading evidence and a complete statutory document set.',
      functionalityScore: 34,
      priceScore: 38,
      preferenceScore: 9,
      finalScore: 88,
      becNote: 'Technical proposal and CIDB grading fully meet requirements. Recommended for adjudication.',
      bacNote: 'BAC confirmed the sequencing plan avoids concurrent facility closures. Referred for final approval.',
      approvalNote: 'Value-for-money and compliance confirmed. Award approved.',
    },
  })
  await prisma.application.create({
    data: {
      tenderId: t011.id,
      tenderReference: t011.reference,
      tenderTitle: t011.title,
      applicantId: KHUMALO,
      companyName: 'Mpumalanga Infrastructure & Engineering Services (Pty) Ltd',
      submittedAt: past(58),
      status: 'UNSUCCESSFUL',
      bidSummary: 'We propose a phased upgrade approach prioritising floodlighting first, followed by ablution facility renovation across all sites.',
      technicalApproach: 'Floodlighting and civil works are scheduled in parallel using two independent site teams to reduce overall programme duration.',
      deliveryTimeline: '11 months across all five sites',
      pricingAmount: 11200000,
      complianceDeclaration: true,
      documents: JSON.stringify(['CIPC Company Registration.pdf', 'SARS Tax Compliance PIN.pdf', 'CIDB Grade 4 Certificate.pdf', 'Financial Proposal.pdf']),
      validDocuments: JSON.stringify(['CIPC Company Registration.pdf', 'SARS Tax Compliance PIN.pdf', 'CIDB Grade 4 Certificate.pdf', 'Financial Proposal.pdf']),
      rejectedDocuments: JSON.stringify([]),
      missingMandatoryDocuments: JSON.stringify([]),
      aiScore: 80,
      aiRecommendation: 'QUALIFY',
      aiSummary: 'AI review confirmed a complete statutory document set.',
      functionalityScore: 30,
      priceScore: 29,
      preferenceScore: 8,
      finalScore: 79,
      becNote: 'Compliant submission with a higher price and longer programme duration than the shortlisted bidder.',
      bacNote: 'BAC noted this bid scored lower on price and duration relative to the recommended bidder.',
      approvalNote: 'Not selected — a higher-scoring, lower-cost compliant bid was received for this tender.',
    },
  })

  // 12. CANCELLED — declined at final approval
  const t012 = await prisma.tender.create({
    data: {
      reference: 'MPG/TOUR/2026/012',
      title: 'Provincial Tourism Marketing Campaign',
      department: 'Department of Economic Development and Tourism',
      description: 'Development and rollout of a province-wide tourism marketing and destination branding campaign.',
      closingDate: past(50),
      status: 'CANCELLED',
      publishedAt: past(80),
      createdById: ADMIN,
      requirements: { create: [
        { title: 'CIPC Company Registration', mandatory: true },
        { title: 'SARS Tax Compliance PIN', mandatory: true },
        { title: 'Campaign Strategy Proposal', mandatory: true },
        { title: 'Financial Proposal', mandatory: true },
      ] },
      criteria: { create: [
        { title: 'Creative Strategy', weight: 40, maxScore: 40 },
        { title: 'Price', weight: 35, maxScore: 35 },
        { title: 'Experience', weight: 15, maxScore: 15 },
        { title: 'Preference / Approved Criteria', weight: 10, maxScore: 10 },
      ] },
    },
  })
  await prisma.application.create({
    data: {
      tenderId: t012.id,
      tenderReference: t012.reference,
      tenderTitle: t012.title,
      applicantId: APPLICANT,
      companyName: 'Mokoena Digital Solutions (Pty) Ltd',
      submittedAt: past(65),
      status: 'UNSUCCESSFUL',
      bidSummary: 'We propose a multi-channel digital and print marketing campaign showcasing the province\'s key tourism destinations.',
      technicalApproach: 'Campaign delivery spans digital advertising, print media placement, and a dedicated destination microsite built and hosted by our in-house team.',
      deliveryTimeline: '6-month campaign flight',
      pricingAmount: 2100000,
      complianceDeclaration: true,
      documents: JSON.stringify(['CIPC Company Registration.pdf', 'SARS Tax Compliance PIN.pdf', 'Campaign Strategy Proposal.pdf', 'Financial Proposal.pdf']),
      validDocuments: JSON.stringify(['CIPC Company Registration.pdf', 'SARS Tax Compliance PIN.pdf', 'Campaign Strategy Proposal.pdf', 'Financial Proposal.pdf']),
      rejectedDocuments: JSON.stringify([]),
      missingMandatoryDocuments: JSON.stringify([]),
      aiScore: 82,
      aiRecommendation: 'QUALIFY',
      aiSummary: 'AI review confirmed a complete statutory document set.',
      functionalityScore: 33,
      priceScore: 28,
      preferenceScore: 9,
      finalScore: 78,
      becNote: 'Creative strategy meets requirements with a compliant document set.',
      bacNote: 'BAC referred the recommendation for final approval.',
      approvalNote: 'Tender declined — the department reallocated this budget line during the provincial adjustments budget process.',
    },
  })

  console.log('Added 6 tenders (007-012) covering DRAFT, EVALUATION, ADJUDICATION, APPROVAL, AWARDED and CANCELLED stages.')
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
