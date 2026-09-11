import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { PageHeader, StatusBadge } from '../../components/Ui'

export default function CompanyVerification() {
  const { users, verifyApplicant } = useApp()
  const applicants = users.filter((user) => user.role === 'APPLICANT')
  const staff = users.filter((user) => user.role !== 'APPLICANT')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  const decide = async (applicantId: string, status: 'APPROVED' | 'REJECTED') => {
    const result = await verifyApplicant(applicantId, status, notes[applicantId])
    setError(result.ok ? '' : result.message ?? 'The verification decision could not be recorded.')
  }

  const hasDirectorConflict = (applicantId: string) => {
    const applicant = applicants.find((item) => item.id === applicantId)
    return (applicant?.directors ?? []).some((director) => staff.some((member) => member.name.trim().toLowerCase() === director.trim().toLowerCase()))
  }

  return <>
    <PageHeader title="Company verification" description="Verify applicant companies before they can respond to tenders. Staff members may not be directors of a company applying through this portal." />
    <div className="notice warning"><strong>Conflict-of-interest control</strong><span>The demo compares declared directors with internal staff accounts. A production version should validate this against an authoritative company-registration source.</span></div>
    {error && <div className="error-box">{error}</div>}
    <div className="verification-grid">{applicants.map((applicant) => {
      const status = applicant.verificationStatus ?? 'PENDING'
      const conflict = hasDirectorConflict(applicant.id)
      return <div className="card verification-card" key={applicant.id}>
        <div className="card-head"><div><span className="eyebrow">Supplier company</span><h3>{applicant.organisation}</h3><p>{applicant.name} · {applicant.email}</p></div><StatusBadge tone={conflict ? 'danger' : status === 'APPROVED' ? 'success' : status === 'REJECTED' ? 'danger' : 'warning'}>{conflict ? 'DIRECTOR CONFLICT' : status}</StatusBadge></div>
        <p><strong>Declared director:</strong> {(applicant.directors ?? []).join(', ') || 'Not declared'}</p>
        <div className="file-list static">{(applicant.verificationDocuments ?? []).map((document) => <span key={document}>{document}</span>)}</div>
        {conflict && <div className="error-box">A staff account matches a declared director. This company cannot be approved or allowed to apply while the conflict exists.</div>}
        {status === 'PENDING' && <><label>Review note<textarea rows={3} value={notes[applicant.id] ?? ''} onChange={(event) => setNotes({ ...notes, [applicant.id]: event.target.value })} placeholder="Record verification findings..." /></label><div className="form-actions"><button className="button secondary" onClick={() => decide(applicant.id, 'REJECTED')}>Reject</button><button className="button primary" disabled={conflict} onClick={() => decide(applicant.id, 'APPROVED')}>Approve company</button></div></>}
        {status !== 'PENDING' && applicant.verificationNote && <p className="muted">Review note: {applicant.verificationNote}</p>}
      </div>
    })}</div>
  </>
}
