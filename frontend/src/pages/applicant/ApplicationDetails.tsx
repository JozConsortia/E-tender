import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { PageHeader, StatusBadge } from '../../components/Ui'

export default function ApplicationDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { applications, currentUser } = useApp()
  const application = applications.find((item) => item.id === id && item.applicantId === currentUser?.id)

  if (!application) return <div className="empty-state"><h3>Application not found</h3><p>You can only access your own submissions.</p><button className="button secondary" onClick={() => navigate('/applicant/applications')}>Back to my applications</button></div>

  const rejectedByAi = application.aiRecommendation === 'REJECTED'
  const finalised = ['SUCCESSFUL', 'UNSUCCESSFUL'].includes(application.status)

  return <>
    <PageHeader title="My application" description={`${application.tenderReference} · ${application.tenderTitle}`} action={<button className="button secondary" onClick={() => navigate('/applicant/applications')}>Back to my applications</button>} />
    <div className="two-column">
      <div className="card">
        <h3>Submission status</h3>
        <div className="result-card">
          <StatusBadge tone={application.status === 'SUCCESSFUL' ? 'success' : application.status === 'UNSUCCESSFUL' ? 'danger' : 'warning'}>{application.status.replace('_', ' ')}</StatusBadge>
          <p>Submitted {new Date(application.submittedAt).toLocaleString('en-ZA')}</p>
        </div>
        <h3>Submitted documents</h3>
        <div className="file-list static">{application.documents.map((file) => <span key={file}>{file}</span>)}</div>
        <h3>AI document review</h3>
        <div className="ai-analysis">
          <div><span>AI recommendation</span><strong>{application.aiRecommendation ?? 'PENDING'}</strong></div>
          <div><span>AI score</span><strong>{application.aiScore ?? '—'}</strong></div>
          <p>{application.aiSummary ?? 'AI processing has not yet been confirmed for this application.'}</p>
        </div>
        {rejectedByAi && <div className="error-box">The AI document check rejected this submission. It will not be forwarded to the Bid Evaluation Committee.</div>}
        {!!application.rejectedDocuments?.length && <p className="muted">Unmatched documents: {application.rejectedDocuments.join(', ')}</p>}
        {!!application.missingMandatoryDocuments?.length && <p className="muted">Missing mandatory evidence: {application.missingMandatoryDocuments.join(', ')}</p>}
      </div>
      <div className="card">
        <h3>Outcome</h3>
        {finalised
          ? <div className={`outcome-box ${application.status === 'SUCCESSFUL' ? 'success' : 'danger'}`}><strong>{application.status === 'SUCCESSFUL' ? 'Application successful' : 'Application unsuccessful'}</strong><p>The final procurement outcome has been recorded by the authorised workflow.</p></div>
          : <div className="notice info"><strong>Outcome pending</strong><span>Your application is still within the procurement workflow. Internal evaluation details are not available to applicants.</span></div>}
      </div>
    </div>
  </>
}
