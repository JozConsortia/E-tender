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

  if (!application || !tender || tender.status !== 'EVALUATION') {
    return <div className="empty-state"><h3>Evaluation is not available</h3><p>This bid is no longer in the BEC evaluation stage.</p><button className="button secondary" onClick={() => navigate('/bec')}>Return to evaluation register</button></div>
  }

  const submitEvaluation = async () => {
    const result = await evaluateApplication(application.id, score, note)
    if (!result.ok) return
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
      </div>
      <div className="card">
        <span className="eyebrow">Published scoring framework</span>
        <h3>Committee assessment</h3>
        {tender.criteria.map((criterion) => <div className="score-row" key={criterion.id}><span>{criterion.title}<small className="cell-title">Weight {criterion.weight}%</small></span><strong>{Math.round((score / 100) * criterion.maxScore)} / {criterion.maxScore}</strong></div>)}
        <label className="range-label">Confirmed total score <strong>{score}/100</strong><input type="range" min="0" max="100" value={score} onChange={(event) => setScore(Number(event.target.value))} /></label>
        <label className="decision-note">BEC evaluation rationale<textarea rows={5} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Explain how the evidence supports the score and recommendation." required /></label>
        <button className="button primary full" onClick={submitEvaluation} disabled={note.trim().length < 10}>{score >= 70 ? 'Submit evaluation to BAC' : 'Record review required'}</button>
      </div>
    </div>
  </>
}
