import { FormEvent, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { isTenderOpenForApplications, isTenderPastClosing, useApp } from '../../context/AppContext'
import { PageHeader } from '../../components/Ui'

const slug = (title: string) => title.trim().replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '')

export default function TenderDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { tenders, applications, submitApplication, currentUser } = useApp()
  const tender = tenders.find((item) => item.id === id)
  const already = useMemo(() => applications.some((application) => application.tenderId === id && application.applicantId === currentUser?.id), [applications, id, currentUser?.id])
  const verified = currentUser?.verificationStatus === 'APPROVED'
  const [files, setFiles] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  if (!tender) return <div className="empty-state"><h3>Tender not found</h3><p>The tender may have been removed from the public application list.</p></div>

  const open = isTenderOpenForApplications(tender)
  const pastClosing = isTenderPastClosing(tender)
  const canApply = verified && open && !already

  const attach = (requirementId: string, title: string) => setFiles((current) => ({ ...current, [requirementId]: `${slug(title)}.pdf` }))
  const detach = (requirementId: string) => setFiles((current) => { const next = { ...current }; delete next[requirementId]; return next })

  const apply = async (event: FormEvent) => {
    event.preventDefault()
    const documents = Object.values(files)
    if (!documents.length) { setError('Attach at least one supporting document for AI validation.'); return }
    const result = await submitApplication(tender.id, currentUser?.organisation ?? '', documents)
    if (!result.ok) { setError(result.message ?? 'Your application could not be submitted.'); return }
    navigate('/applicant/outcomes')
  }

  return <>
    <PageHeader title={tender.title} description={`${tender.reference} · ${tender.department}`} action={<button className="button secondary" onClick={() => navigate('/applicant/tenders')}>Back to tenders</button>} />
    <div className="two-column">
      <div className="card">
        <span className="eyebrow">Published tender package</span>
        <p className="large-copy">{tender.description}</p>
        <h3>Requirements</h3>
        <div className="requirement-list">{tender.requirements.map((requirement) => <div key={requirement.id}><span>✓</span>{requirement.title}<b>{requirement.mandatory ? 'Mandatory' : 'Optional'}</b></div>)}</div>
        <h3>Published evaluation criteria</h3>
        <div className="criteria-list">{tender.criteria.map((criterion) => <div key={criterion.id}><span>{criterion.title}</span><strong>{criterion.weight}%</strong></div>)}</div>
      </div>
      <form className="card form-card" onSubmit={apply}>
        <div className={`notice ${verified ? 'info' : 'warning'}`}><strong>{verified ? 'Verified supplier' : 'Verification required'}</strong><span>{verified ? 'Your company is approved to submit applications.' : 'An administrator must approve your company before you can submit a tender.'}</span></div>
        {pastClosing && tender.status !== 'CANCELLED' && <div className="notice warning"><strong>Application window closed</strong><span>This tender closed on {new Date(tender.closingDate).toLocaleString('en-ZA')}.</span></div>}
        {tender.status !== 'PUBLISHED' && !pastClosing && <div className="notice warning"><strong>Application unavailable</strong><span>This tender is not currently open for applications.</span></div>}
        <label>Applying company<input value={currentUser?.organisation ?? ''} disabled readOnly /></label>
        <div className="upload-box">
          <strong>Supporting documents</strong>
          <small>Attach the evidence requested by the published tender. This demo simulates file attachments and does not upload real files.</small>
          {tender.requirements.map((requirement) => <div className="attach-row" key={requirement.id}>
            <span>{requirement.title}<b className="required-tag">{requirement.mandatory ? 'Mandatory' : 'Optional'}</b></span>
            {files[requirement.id]
              ? <span className="file-chip">{files[requirement.id]}<button type="button" onClick={() => detach(requirement.id)} disabled={!canApply} aria-label={`Remove ${requirement.title} document`}>×</button></span>
              : <button type="button" className="button secondary small" onClick={() => attach(requirement.id, requirement.title)} disabled={!canApply}>+ Attach document</button>}
          </div>)}
        </div>
        {error && <div className="error-box">{error}</div>}
        <div className="notice info"><strong>AI document review</strong><span>The system will validate uploaded evidence, reject unmatched documents, and only send valid requirements to the BEC for review.</span></div>
        {already ? <div className="success-box">You already submitted this tender. The final outcome will appear in Outcomes.</div>
          : !verified ? <div className="muted">Application access is unavailable until company verification is complete.</div>
          : !open ? <div className="muted">Applications are closed or the tender is no longer accepting submissions.</div>
          : <button className="button primary full large" type="submit">Submit application</button>}
      </form>
    </div>
  </>
}
