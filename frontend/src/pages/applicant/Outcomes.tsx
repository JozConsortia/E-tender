import { useApp } from '../../context/AppContext'
import { PageHeader, StatusBadge } from '../../components/Ui'

export default function Outcomes() {
  const { currentUser, applications } = useApp()
  const outcomes = applications.filter((application) => application.applicantId === currentUser?.id && ['SUCCESSFUL', 'UNSUCCESSFUL'].includes(application.status))

  return <>
    <PageHeader title="Tender outcomes" description="Only final outcomes for your own tender submissions are shown here." />
    {outcomes.length ? <div className="outcome-grid">{outcomes.map((application) => <div className="card outcome-card" key={application.id}>
      <StatusBadge tone={application.status === 'SUCCESSFUL' ? 'success' : 'danger'}>{application.status}</StatusBadge>
      <h3>{application.tenderTitle}</h3>
      <span>{application.tenderReference}</span>
      <p>{application.status === 'SUCCESSFUL'
        ? 'Your company has been selected as the successful bidder.'
        : (application.missingMandatoryDocuments?.length ?? 0) > 0
          ? `Not selected: missing required evidence — ${application.missingMandatoryDocuments!.join(', ')}.`
          : 'Your company was not selected for this tender.'}</p>
    </div>)}</div> : <div className="empty-state"><h3>No final outcomes yet</h3><p>Once an authorised final decision has been recorded, your result will appear here.</p></div>}
  </>
}
