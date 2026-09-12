import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { PageHeader, StatusBadge } from '../components/Ui'
import { signatureFontFamily } from '../components/SignatureField'

const Signature = ({ name, style }: { name?: string; style?: number }) =>
  name ? <span className="report-signature" style={{ fontFamily: signatureFontFamily(style) }}>{name}</span> : <>—</>

const statusTone = (status: string) => {
  if (status === 'SUCCESSFUL' || status === 'SHORTLISTED') return 'success' as const
  if (status === 'UNSUCCESSFUL') return 'danger' as const
  return 'warning' as const
}

export default function ApplicationReport() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { applications, tenders, currentUser } = useApp()
  const application = applications.find((item) => item.id === id)
  const tender = application ? tenders.find((item) => item.id === application.tenderId) : undefined

  if (!application || !tender) {
    return <div className="empty-state"><h3>Report not available</h3><p>This application is not part of your current case list.</p><button className="button secondary" onClick={() => navigate(-1)}>Go back</button></div>
  }

  return <div className="report-page">
    <div className="no-print">
      <PageHeader title="Bid submission report" description={`${application.tenderReference} · ${application.companyName}`} action={<div className="form-actions"><button className="button secondary" onClick={() => navigate(-1)}>Back</button><button className="button primary" onClick={() => window.print()}>Print / Save as PDF</button></div>} />
    </div>

    <div className="card report-section">
      <div className="report-head">
        <div>
          <span className="eyebrow">{tender.reference} · {tender.department}</span>
          <h2>{tender.title}</h2>
        </div>
        <StatusBadge tone={statusTone(application.status)}>{application.status.replace('_', ' ')}</StatusBadge>
      </div>
      <div className="report-grid">
        <div className="report-field"><span>Bidding company</span><p>{application.companyName}</p></div>
        <div className="report-field"><span>Submitted</span><p>{new Date(application.submittedAt).toLocaleString('en-ZA')}</p></div>
        <div className="report-field"><span>Total price quoted</span><p>{application.pricingAmount !== undefined ? `R ${application.pricingAmount.toLocaleString('en-ZA')}` : 'Not provided'}</p></div>
        <div className="report-field"><span>Delivery timeline</span><p>{application.deliveryTimeline ?? 'Not provided'}</p></div>
      </div>
    </div>

    <div className="card report-section">
      <h3>Bid summary</h3>
      <p>{application.bidSummary ?? 'Not provided.'}</p>
    </div>

    <div className="card report-section">
      <h3>Technical approach</h3>
      <p>{application.technicalApproach ?? 'Not provided.'}</p>
    </div>

    <div className="card report-section">
      <h3>Compliance declaration</h3>
      <p>{application.complianceDeclaration ? 'The bidder declared compliance with the published tender terms and conditions.' : 'No compliance declaration was recorded.'}</p>
    </div>

    <div className="card report-section">
      <h3>Submitted documents</h3>
      <div className="file-list static">{application.documents.map((file) => <span key={file}>{file}</span>)}</div>
    </div>

    {application.quotationDocuments && application.quotationDocuments.length > 0 && <div className="card report-section">
      <h3>Quotations</h3>
      <div className="file-list static">{application.quotationDocuments.map((file) => <span key={file}>{file}</span>)}</div>
    </div>}

    {application.sbdForm && <>
      <div className="card report-section">
        <h3>Company and price</h3>
        <div className="report-grid">
          <div className="report-field"><span>Company registration number</span><p>{application.sbdForm.companyPrice.companyRegNumber || 'Not provided'}</p></div>
          <div className="report-field"><span>VAT registration number</span><p>{application.sbdForm.companyPrice.vatNumber || 'Not provided'}</p></div>
        </div>
      </div>

      <div className="card report-section">
        <h3>SBD 4 — Declaration of interest</h3>
        <div className="report-grid">
          <div className="report-field"><span>Full name / position</span><p>{application.sbdForm.sbd4.fullName || '—'} · {application.sbdForm.sbd4.position || '—'}</p></div>
          <div className="report-field"><span>Company / tax / VAT reg.</span><p>{application.sbdForm.sbd4.companyRegNumber || '—'} · {application.sbdForm.sbd4.taxRefNumber || '—'} · {application.sbdForm.sbd4.vatRegNumber || '—'}</p></div>
          <div className="report-field"><span>Presently employed by the state</span><p>{application.sbdForm.sbd4.employedByState ? 'Yes' : 'No'}</p></div>
          <div className="report-field"><span>Conducted business with the state (12 months)</span><p>{application.sbdForm.sbd4.conductedBusinessWithState ? 'Yes' : 'No'}</p></div>
          <div className="report-field"><span>Relationship with a state evaluator</span><p>{application.sbdForm.sbd4.relationshipWithStateEvaluator ? 'Yes' : 'No'}</p></div>
          <div className="report-field"><span>Aware of another bidder's relationship</span><p>{application.sbdForm.sbd4.awareOfOtherBidderRelationship ? 'Yes' : 'No'}</p></div>
          <div className="report-field"><span>Interest in other related bidders</span><p>{application.sbdForm.sbd4.interestInOtherBidders ? 'Yes' : 'No'}</p></div>
          <div className="report-field"><span>Declared and certified by</span><p><Signature name={application.sbdForm.sbd4.declarationSignedBy} style={application.sbdForm.signatureStyle} /> ({application.sbdForm.sbd4.declarationPosition || '—'}) — {application.sbdForm.sbd4.declarationCertified ? 'Certified' : 'Not certified'}</p></div>
        </div>
        {application.sbdForm.sbd4.persons.length > 0 && <div className="file-list static">{application.sbdForm.sbd4.persons.map((p, i) => <span key={i}>{p.fullName || 'Unnamed'}{p.stateEmployeeNumber ? ` (state: ${p.stateEmployeeNumber})` : ''}</span>)}</div>}
        {(application.sbdForm.sbd4.employedByState || application.sbdForm.sbd4.conductedBusinessWithState || application.sbdForm.sbd4.relationshipWithStateEvaluator || application.sbdForm.sbd4.awareOfOtherBidderRelationship || application.sbdForm.sbd4.interestInOtherBidders) && <div className="notice warning" style={{ marginTop: 12 }}><strong>Review flag</strong><span>One or more SBD4 conflict-of-interest questions were answered "Yes" — verify before proceeding.</span></div>}
      </div>

      <div className="card report-section">
        <h3>SBD 6.1 — Preference points claim</h3>
        <div className="report-grid">
          <div className="report-field"><span>B-BBEE status level</span><p>{application.sbdForm.sbd61.bbeeStatusLevel || 'Not claimed'}</p></div>
          <div className="report-field"><span>Points claimed</span><p>{application.sbdForm.sbd61.pointsClaimed || '—'}</p></div>
          <div className="report-field"><span>Proof attached</span><p>{application.sbdForm.sbd61.proofAttached || '—'}</p></div>
          <div className="report-field"><span>Sub-contracting</span><p>{application.sbdForm.sbd61.subcontracting ? 'Yes' : 'No'}</p></div>
          <div className="report-field"><span>Company type / classification</span><p>{application.sbdForm.sbd61.companyType} · {application.sbdForm.sbd61.companyClassification}</p></div>
          <div className="report-field"><span>Years in business</span><p>{application.sbdForm.sbd61.yearsInBusiness || '—'}</p></div>
        </div>
      </div>

      <div className="card report-section">
        <h3>SBD 6.2 — Local production and content</h3>
        <div className="report-grid">
          <div className="report-field"><span>Imported content declared</span><p>{application.sbdForm.sbd62.hasImportedContent ? 'Yes' : 'No'}</p></div>
          <div className="report-field"><span>Bid price excl. VAT / imported content</span><p>R {application.sbdForm.sbd62.bidPriceExclVat || '0'} / R {application.sbdForm.sbd62.importedContentRand || '0'}</p></div>
          <div className="report-field"><span>Declared by</span><p><Signature name={application.sbdForm.sbd62.declaredByName} style={application.sbdForm.signatureStyle} /> ({application.sbdForm.sbd62.declaredByCapacity || '—'})</p></div>
        </div>
      </div>

      <div className="card report-section">
        <h3>SBD 8 — Past supply chain practices</h3>
        <div className="report-grid">
          <div className="report-field"><span>Convicted of fraud/corruption</span><p>{application.sbdForm.sbd8.convictedFraudCorruption ? 'Yes' : 'No'}</p></div>
          <div className="report-field"><span>Listed on Register for Tender Defaulters</span><p>{application.sbdForm.sbd8.listedTenderDefaulters ? 'Yes' : 'No'}</p></div>
          <div className="report-field"><span>Prior contract terminated (poor performance)</span><p>{application.sbdForm.sbd8.contractTerminatedPoorPerformance ? 'Yes' : 'No'}</p></div>
          <div className="report-field"><span>Currently restricted from public sector business</span><p>{application.sbdForm.sbd8.restrictedFromBidding ? 'Yes' : 'No'}</p></div>
        </div>
        {application.sbdForm.sbd8.details && <p>{application.sbdForm.sbd8.details}</p>}
        <p><strong>Declared by:</strong> <Signature name={application.sbdForm.sbd8.declaredByName} style={application.sbdForm.signatureStyle} /> ({application.sbdForm.sbd8.declaredByPosition || '—'})</p>
        {(application.sbdForm.sbd8.convictedFraudCorruption || application.sbdForm.sbd8.listedTenderDefaulters || application.sbdForm.sbd8.contractTerminatedPoorPerformance || application.sbdForm.sbd8.restrictedFromBidding) && <div className="notice warning"><strong>Review flag</strong><span>One or more SBD8 past-practice questions were answered "Yes" — verify before proceeding.</span></div>}
      </div>

      <div className="card report-section">
        <h3>SBD 9 — Certificate of independent bid determination</h3>
        {application.sbdForm.sbd9.finalCertification
          ? <p>Certified independent by <Signature name={application.sbdForm.sbd9.signedByName} style={application.sbdForm.signatureStyle} /> ({application.sbdForm.sbd9.signedByPosition || '—'}).</p>
          : <p>Not certified.</p>}
      </div>
    </>}

    <div className="card report-section">
      <h3>AI document assessment</h3>
      <div className="ai-analysis"><div><span>AI recommendation</span><strong>{application.aiRecommendation ?? 'PENDING'}</strong></div><div><span>AI score</span><strong>{application.aiScore ?? '—'}</strong></div><p>{application.aiSummary ?? 'AI processing has not yet been confirmed for this application.'}</p></div>
    </div>

    {(currentUser?.role === 'BAC' || currentUser?.role === 'APPROVER' || currentUser?.role === 'ADMIN' || currentUser?.role === 'AUDITOR') && application.becNote && <div className="card report-section">
      <h3>BEC evaluation rationale</h3>
      <p>{application.becNote}</p>
    </div>}

    {(currentUser?.role === 'APPROVER' || currentUser?.role === 'ADMIN' || currentUser?.role === 'AUDITOR') && application.bacNote && <div className="card report-section">
      <h3>BAC adjudication rationale</h3>
      <p>{application.bacNote}</p>
    </div>}

    {application.approvalNote && <div className="card report-section">
      <h3>Final approval decision</h3>
      <p>{application.approvalNote}</p>
    </div>}
  </div>
}
