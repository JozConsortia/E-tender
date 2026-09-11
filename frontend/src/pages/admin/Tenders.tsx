import { useState } from 'react'
import { Link } from 'react-router-dom'
import { isTenderPastClosing, useApp } from '../../context/AppContext'
import { PageHeader, StatusBadge } from '../../components/Ui'

export default function Tenders() {
  const { tenders, publishTender, advanceTenderStage } = useApp()
  const [error, setError] = useState('')

  const runPublish = async (id: string) => {
    const result = await publishTender(id)
    setError(result.ok ? '' : result.message ?? 'The tender could not be published.')
  }

  const runAdvance = async (id: string) => {
    const result = await advanceTenderStage(id)
    setError(result.ok ? '' : result.message ?? 'The tender stage could not be advanced.')
  }

  const statusTone = (status: string) => status === 'PUBLISHED' ? 'success' : status === 'EVALUATION' || status === 'ADJUDICATION' || status === 'APPROVAL' ? 'warning' : status === 'CANCELLED' ? 'danger' : status === 'AWARDED' ? 'success' : 'neutral'

  return <>
    <PageHeader title="Tender management" description="Create and publish approved tender packages. Once published, the requirements and evaluation criteria are locked." action={<Link to="/admin/tenders/create" className="button primary">+ Create tender</Link>} />
    <div className="notice info"><strong>Lifecycle control</strong><span>The administrator publishes the tender only. After the closing time, the system automatically moves the tender into evaluation; BEC, BAC and the final approver then perform their own role-specific tasks.</span></div>
    {error && <div className="error-box">{error}</div>}
    <div className="card table-card"><div className="table-wrap"><table><thead><tr><th>Reference</th><th>Title</th><th>Requirements</th><th>Criteria</th><th>Status</th><th>Closing</th><th>Action</th></tr></thead><tbody>{tenders.map((tender) => {
      const pastClosing = isTenderPastClosing(tender)
      return <tr key={tender.id}>
        <td><strong>{tender.reference}</strong></td>
        <td><div className="cell-title">{tender.title}<small>{tender.department}</small></div></td>
        <td>{tender.requirements.length}</td>
        <td>{tender.criteria.length}</td>
        <td><StatusBadge tone={statusTone(tender.status)}>{tender.status}</StatusBadge></td>
        <td>{new Date(tender.closingDate).toLocaleString('en-ZA')}{pastClosing && tender.status === 'PUBLISHED' && <div><StatusBadge tone="warning">System will open evaluation</StatusBadge></div>}</td>
        <td>{tender.status === 'DRAFT' ? <div className="action-cell"><button className="button small primary" onClick={() => runPublish(tender.id)}>Publish</button></div> : tender.status === 'AWARDED' ? <span className="muted">Award completed</span> : <div className="action-cell"><button className="button small secondary" onClick={() => runAdvance(tender.id)}>Move to next stage</button></div>}</td>
      </tr>
    })}</tbody></table></div></div>
  </>
}
