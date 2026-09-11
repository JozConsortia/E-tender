import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { PageHeader } from '../../components/Ui'

export default function BecEvaluations() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { applications, evaluateApplication, tenders } = useApp()
  const application = applications.find((item) => item.id === id)
  const tender = application ? tenders.find((item) => item.id === application.tenderId) : undefined
  const [score, setScore] = useState(application?.aiScore ?? 85)
  const [note, setNote] = useState(application?.becNote ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  if (!application || !tender || tender.status !== 'EVALUATION') {
    return <div className="empty-state"><h3>Evaluation is not available</h3><p>This bid is no longer in the BEC evaluation stage.</p><button className="button secondary" onClick={() => navigate('/bec')}>Return to evaluation register</button></div>
  }

  const rejectedByAi = application.aiRecommendation === 'REJECTED'
  const evaluable = ['SUBMITTED', 'UNDER_EVALUATION'].includes(application.status) && !rejectedByAi

  const submitEvaluation = async () => {
    setError('')
    setSaving(true)
    const result = await evaluateApplication(application.id, score, note)
    setSaving(false)
    if (!result.ok) { setError(result.message ?? 'The evaluation could not be saved.'); return }
    navigate('/bec')
  }

  return <>
    <PageHeader title="Bid evaluation" description={`${application.tenderReference} · ${application.companyName}`} action={<button className="button secondary" onClick={() => navigate('/bec')}>Back to register</button>} />
    <div className="notice warning"><strong>Evidence-based assessment</strong><span>Confirm each score against the published criteria. AI analysis supports the committee but does not replace its judgement.</span></div>
    <div className="two-column">
      <div className="card">
        <span className="eyebrow">Bid submission</span>
        <h3>{application.companyName}</h3>
        <p className="muted">{application.tenderTitle}</p>
        <h3>Submitted documents</h3>
        <div className="file-list static">{application.documents.map((file) => <span key={file}>{file}</span>)}</div>
        <h3>AI document assessment</h3>
        <div className="ai-analysis"><div><span>AI recommendation</span><strong>{application.aiRecommendation ?? 'PENDING'}</strong></div><div><span>AI score</span><strong>{application.aiScore ?? '—'}</strong></div><p>{application.aiSummary ?? 'AI processing has not yet been confirmed for this application.'}</p></div>
        {!!application.missingMandatoryDocuments?.length && <p className="muted">Missing mandatory evidence: {application.missingMandatoryDocuments.join(', ')}</p>}
      </div>
      <div className="card">
        <span className="eyebrow">Published scoring framework</span>
        <h3>Committee assessment</h3>
        {tender.criteria.map((criterion) => <div className="score-row" key={criterion.id}><span>{criterion.title}<small className="cell-title">Weight {criterion.weight}%</small></span><strong>{Math.round((score / 100) * criterion.maxScore)} / {criterion.maxScore}</strong></div>)}
        <label className="range-label">Confirmed total score <strong>{score}/100</strong><input type="range" min="0" max="100" value={score} onChange={(event) => setScore(Number(event.target.value))} /></label>
        <label className="decision-note">BEC evaluation rationale<textarea rows={5} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Explain how the evidence supports the score and recommendation." required /></label>
        {!evaluable && <div className="notice warning"><strong>{rejectedByAi ? 'Rejected by AI document review' : 'Not available for evaluation'}</strong><span>{rejectedByAi ? 'This submission did not pass the AI document check and cannot be evaluated by the committee.' : 'This bid has already been evaluated or returned for review.'}</span></div>}
        {error && <div className="error-box">{error}</div>}
        <button className="button primary full" onClick={submitEvaluation} disabled={!evaluable || saving || note.trim().length < 10}>{saving ? 'Saving…' : score >= 70 ? 'Submit evaluation to BAC' : 'Record review required'}</button>
      </div>
    </div>
  </>
}
