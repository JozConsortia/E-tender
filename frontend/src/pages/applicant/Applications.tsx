import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { EmptyState, PageHeader, StatusBadge } from '../../components/Ui'

const statusTone = (status: string) => {
  if (status === 'SUCCESSFUL' || status === 'SHORTLISTED') return 'success'
  if (status === 'UNSUCCESSFUL') return 'danger'
  if (status === 'REVIEW_REQUIRED') return 'warning'
  return 'warning'
}

export default function Applications() {
  const { currentUser, applications } = useApp()
  const mine = applications.filter((a) => a.applicantId === currentUser?.id)
  return <><PageHeader title="My applications" description="Private view of your tender submissions and current status." />
    {mine.length ? <div className="card table-card"><div className="table-wrap"><table><thead><tr><th>Reference</th><th>Tender</th><th>Documents</th><th>AI review</th><th>Status</th><th></th></tr></thead><tbody>{mine.map((a) => <tr key={a.id}>
      <td><strong>{a.tenderReference}</strong></td>
      <td>{a.tenderTitle}</td>
      <td>{a.documents.length}</td>
      <td><StatusBadge tone={a.aiRecommendation === 'QUALIFY' ? 'success' : a.aiRecommendation === 'REJECTED' ? 'danger' : 'warning'}>{a.aiRecommendation ?? 'PENDING'}</StatusBadge></td>
      <td><StatusBadge tone={statusTone(a.status)}>{a.status.replace('_', ' ')}</StatusBadge></td>
      <td><Link className="text-link" to={`/applicant/applications/${a.id}`}>View →</Link></td>
    </tr>)}</tbody></table></div></div> : <EmptyState title="No applications yet" message="Browse available tenders to submit your first application." />}
  </>
}
