import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { PageHeader } from '../../components/Ui'

export default function BacAdjudication() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { applications, tenders, decideApplication } = useApp()
  const application = applications.find((item) => item.id === id)
  const tender = application ? tenders.find((item) => item.id === application.tenderId) : undefined
  const [note, setNote] = useState('')

  if (!application || !tender || tender.status !== 'ADJUDICATION' || application.status !== 'SHORTLISTED') {
    return <div className="empty-state"><h3>Adjudication is not available</h3><p>This case must complete BEC evaluation before the BAC can review it.</p><button className="button secondary" onClick={() => navigate('/bac')}>Return to adjudication register</button></div>
  }

  const submit = async (decision: 'APPROVE' | 'RETURN') => {
    if (note.trim().length < 10) return
    if (decision === 'APPROVE') {
      await decideApplication(application.id, 'SHORTLISTED', note)
    } else {
      await decideApplication(application.id, 'REVIEW_REQUIRED', note)
    }
    navigate('/bac')
  }

  return <>
    <PageHeader title="Adjudication case" description={`${application.tenderReference} · ${application.companyName}`} action={<button className="button secondary" onClick={() => navigate('/bac')}>Back to register</button>} />
    <div className="two-column">
      <div className="card">
        <span className="eyebrow">BEC recommendation</span>
        <h2>{application.companyName}</h2>
        <p className="muted">{application.tenderTitle}</p>
        <div className="big-score">{application.finalScore ?? application.aiScore}<small>/100</small></div>
        <div className="mini-metrics"><div>Functionality<strong>{application.functionalityScore ?? '—'}</strong></div><div>Price<strong>{application.priceScore ?? '—'}</strong></div><div>Preference<strong>{application.preferenceScore ?? '—'}</strong></div></div>
        <h3>Submitted evidence</h3>
        <div className="file-list static">{application.documents.map((document) => <span key={document}>{document}</span>)}</div>
        <div className="notice info"><strong>Separation of duties</strong><span>The BAC records the adjudication rationale. Final award authority remains with the authorised approver.</span></div>
      </div>
      <div className="card form-card"><span className="eyebrow">Committee decision</span><label>Adjudication rationale<textarea rows={7} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Explain why the recommendation is supported or returned." required /></label><div className="form-actions"><button className="button secondary" onClick={() => submit('RETURN')} disabled={note.trim().length < 10}>Return to BEC</button><button className="button primary" onClick={() => submit('APPROVE')} disabled={note.trim().length < 10}>Refer to final approval</button></div></div>
    </div>
  </>
}
