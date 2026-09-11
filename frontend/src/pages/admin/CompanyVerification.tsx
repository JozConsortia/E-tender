import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { PageHeader, StatusBadge } from '../../components/Ui'

export default function CompanyVerification() {
  const { users, verifyApplicant, renameCompany } = useApp()
  const applicants = users.filter((user) => user.role === 'APPLICANT')
  const staff = users.filter((user) => user.role !== 'APPLICANT')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nameDraft, setNameDraft] = useState('')
  const [error, setError] = useState('')

  const hasDirectorConflict = (applicantId: string) => {
    const applicant = applicants.find((item) => item.id === applicantId)
    return (applicant?.directors ?? []).some((director) => staff.some((member) => member.name.trim().toLowerCase() === director.trim().toLowerCase()))
  }

  const startEdit = (id: string, current: string) => { setEditingId(id); setNameDraft(current); setError('') }
  const cancelEdit = () => { setEditingId(null); setNameDraft('') }
  const saveEdit = async (id: string) => {
    if (!nameDraft.trim()) { setError('Company name cannot be empty.'); return }
    const result = await renameCompany(id, nameDraft.trim())
    if (!result.ok) { setError(result.message ?? 'The company name could not be updated.'); return }
    cancelEdit()
  }

  return <>
    <PageHeader title="Company verification" description="Verify applicant companies before they can respond to tenders. Staff members may not be directors of a company applying through this portal." />
    <div className="notice warning"><strong>Conflict-of-interest control</strong><span>The demo compares declared directors with internal staff accounts. A production version should validate this against an authoritative company-registration source.</span></div>
    {error && <div className="error-box">{error}</div>}
    <div className="verification-grid">{applicants.map((applicant) => {
      const status = applicant.verificationStatus ?? 'PENDING'
      const conflict = hasDirectorConflict(applicant.id)
      const isEditing = editingId === applicant.id
      return <div className="card verification-card" key={applicant.id}>
        <div className="card-head">
          <div>
            <span className="eyebrow">Supplier company</span>
            {isEditing
              ? <div className="form-actions"><input value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} /><button className="button secondary small" onClick={cancelEdit}>Cancel</button><button className="button primary small" onClick={() => saveEdit(applicant.id)}>Save</button></div>
              : <h3>{applicant.organisation} <button className="text-link" onClick={() => startEdit(applicant.id, applicant.organisation ?? '')}>Edit name</button></h3>}
            <p>{applicant.name} · {applicant.email}</p>
          </div>
          <StatusBadge tone={conflict ? 'danger' : status === 'APPROVED' ? 'success' : status === 'REJECTED' ? 'danger' : 'warning'}>{conflict ? 'DIRECTOR CONFLICT' : status}</StatusBadge>
        </div>
        <p><strong>Declared director:</strong> {(applicant.directors ?? []).join(', ') || 'Not declared'}</p>
        <div className="file-list static">{(applicant.verificationDocuments ?? []).map((document) => <span key={document}>{document}</span>)}</div>
        {conflict && <div className="error-box">A staff account matches a declared director. This company cannot be approved or allowed to apply while the conflict exists.</div>}
        {status === 'PENDING' && <><label>Review note<textarea rows={3} value={notes[applicant.id] ?? ''} onChange={(event) => setNotes({ ...notes, [applicant.id]: event.target.value })} placeholder="Record verification findings..." /></label><div className="form-actions"><button className="button secondary" onClick={async () => { await verifyApplicant(applicant.id, 'REJECTED', notes[applicant.id]) }}>Reject</button><button className="button primary" disabled={conflict} onClick={async () => { await verifyApplicant(applicant.id, 'APPROVED', notes[applicant.id]) }}>Approve company</button></div></>}
        {status !== 'PENDING' && applicant.verificationNote && <p className="muted">Review note: {applicant.verificationNote}</p>}
      </div>
    })}</div>
  </>
}
