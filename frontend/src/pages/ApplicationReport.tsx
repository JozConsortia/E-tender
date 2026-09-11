import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { PageHeader, StatusBadge } from '../components/Ui'

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
