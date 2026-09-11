import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { PageHeader } from '../../components/Ui'

export default function FinalApproval() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { applications, tenders, decideApplication } = useApp()
  const application = applications.find((item) => item.id === id)
  const tender = application ? tenders.find((item) => item.id === application.tenderId) : undefined
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  if (!application || !tender || tender.status !== 'APPROVAL' || application.status !== 'SHORTLISTED') {
    return <div className="empty-state"><h3>Approval is not available</h3><p>This case must complete BAC adjudication before final approval.</p><button className="button secondary" onClick={() => navigate('/approver')}>Return to approval register</button></div>
  }

  const decide = async (outcome: 'APPROVE' | 'RETURN' | 'DECLINE') => {
    if (note.trim().length < 10) return
    const status = outcome === 'APPROVE' ? 'SUCCESSFUL' : outcome === 'RETURN' ? 'SHORTLISTED' : 'UNSUCCESSFUL'
    const result = await decideApplication(application.id, status, note)
    if (!result.ok) { setError(result.message ?? 'The approval decision could not be recorded.'); return }
    navigate('/approver')
  }

  return <>
    <PageHeader title="Final award decision" description={`${application.tenderReference} · Authorised final approval`} action={<div className="form-actions"><Link className="button secondary" to={`/applications/${application.id}/report`}>View full report</Link><button className="button secondary" onClick={() => navigate('/approver')}>Back to register</button></div>} />
    <div className="two-column">
      <div className="card approval-card"><span className="eyebrow">Recommended bidder</span><h2>{application.companyName}</h2><p className="muted">{application.tenderTitle}</p><div className="big-score">{application.finalScore ?? application.aiScore}<small>/100</small></div><div className="mini-metrics"><div>Functionality<strong>{application.functionalityScore ?? '—'}</strong></div><div>Price<strong>{application.priceScore ?? '—'}</strong></div><div>Preference<strong>{application.preferenceScore ?? '—'}</strong></div></div><div className="decision-records"><div><span>BEC rationale</span><p>{application.becNote ?? 'No BEC rationale has been recorded.'}</p></div><div><span>BAC rationale</span><p>{application.bacNote ?? 'No BAC rationale has been recorded.'}</p></div></div><div className="notice info"><strong>Final authority</strong><span>Review the BEC and BAC record before recording the authorised outcome.</span></div></div>
  <div className="card form-card"><span className="eyebrow">Decision record</span><label>Approval rationale<textarea rows={7} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Record the reasons for approving, declining, or returning this recommendation." required /></label>{error && <div className="error-box">{error}</div>}<div className="form-actions"><button className="button secondary" onClick={() => decide('RETURN')} disabled={note.trim().length < 10}>Return to BAC</button><button className="button danger" onClick={() => decide('DECLINE')} disabled={note.trim().length < 10}>Decline award</button><button className="button primary" onClick={() => decide('APPROVE')} disabled={note.trim().length < 10}>Approve award</button></div></div>
    </div>
  </>
}
