import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { PageHeader, StatCard, StatusBadge } from '../../components/Ui'

export default function AdminDashboard() {
  const { tenders } = useApp()
  return <>
    <PageHeader title="Tender administration" description="Publish approved tender packages and manage the public tender lifecycle." action={<Link to="/admin/tenders/create" className="button primary">+ Create tender</Link>} />
    <div className="stats-grid"><StatCard label="Total tenders" value={tenders.length} hint="All stages"/><StatCard label="Published" value={tenders.filter(t => t.status === 'PUBLISHED').length}/><StatCard label="In evaluation" value={tenders.filter(t => t.status === 'EVALUATION').length}/><StatCard label="Awarded" value={tenders.filter(t => t.status === 'AWARDED').length}/></div>
    <div className="card table-card"><div className="card-head"><div><h3>Recent tenders</h3><p>Only administrators can create or publish tender packages.</p></div><Link to="/admin/tenders" className="text-link">View all →</Link></div><div className="table-wrap"><table><thead><tr><th>Reference</th><th>Tender</th><th>Status</th><th>Applications</th><th>Closing</th></tr></thead><tbody>{tenders.slice(0, 5).map(t => <tr key={t.id}><td><strong>{t.reference}</strong></td><td>{t.title}</td><td><StatusBadge tone={t.status === 'PUBLISHED' ? 'success' : t.status === 'EVALUATION' ? 'warning' : 'neutral'}>{t.status}</StatusBadge></td><td>{t.applications}</td><td>{new Date(t.closingDate).toLocaleString('en-ZA')}</td></tr>)}</tbody></table></div></div>
  </>
}
