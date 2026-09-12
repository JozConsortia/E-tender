import { ChangeEvent, FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const requiredDocuments = [
  { label: 'Company Registration', field: 'companyRegistrationDoc' },
  { label: 'Tax Compliance Certificate', field: 'taxComplianceDoc' },
  { label: 'B-BBEE Certificate', field: 'bbeeCertificateDoc' },
] as const

export default function Signup() {
  const { registerApplicant } = useApp()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [organisation, setOrganisation] = useState('')
  const [director, setDirector] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [documents, setDocuments] = useState<Record<string, File>>({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (requiredDocuments.some((document) => !documents[document.field])) {
      setError('Attach each required company document before submitting for review.')
      return
    }
    setSubmitting(true)
    const result = await registerApplicant({
      name, email, password, organisation, director,
      companyRegistrationDoc: documents.companyRegistrationDoc,
      taxComplianceDoc: documents.taxComplianceDoc,
      bbeeCertificateDoc: documents.bbeeCertificateDoc,
    })
    setSubmitting(false)
    if (!result.ok) { setError(result.message ?? 'Registration could not be completed.'); return }

    const rejected = result.user?.verificationStatus === 'REJECTED'
    navigate('/login', { state: rejected
      ? { message: `Registration could not be verified. ${result.user?.verificationNote ?? 'One or more documents failed AI screening.'}`, variant: 'error' }
      : { message: 'Registration submitted. Your company must be approved before you can apply for tenders.' } })
  }

  const attachDocument = (field: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) setDocuments((current) => ({ ...current, [field]: file }))
    event.target.value = ''
  }
  const removeDocument = (field: string) => setDocuments((current) => { const next = { ...current }; delete next[field]; return next })

  return <div className="login-page">
    <div className="login-panel signup-panel">
      <Link to="/" className="brand"><span className="brand-mark logo-mark"><img src="/mpumalanga-logo.jpeg" alt="Mpumalanga Provincial Government" /></span><span><strong>Mpumalanga Provincial Treasury</strong><small>Procurement Portal</small></span></Link>
      <div className="login-copy"><span className="eyebrow">Supplier onboarding</span><h1>Register your company.</h1><p>Submit your company details and supporting documents for verification before responding to tenders.</p></div>
      <form onSubmit={submit} className="login-form">
        <label>Contact name<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required /></label>
        <label>Company name<input value={organisation} onChange={(event) => setOrganisation(event.target.value)} autoComplete="organization" required /></label>
        <label>Company director<input value={director} onChange={(event) => setDirector(event.target.value)} autoComplete="off" required placeholder="Director listed for the applying company" /></label>
        <label>Email address<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required /></label>
        <label>Password<div className="password-field">
          <input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} required />
          <button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
        </div></label>
        <div className="upload-box">
          <strong>Company documents</strong>
          <small>Upload each document below (PDF, JPG or PNG). AI screens each document against the type expected before your registration is submitted for human review.</small>
          {requiredDocuments.map((document) => <div className="attach-row" key={document.field}>
            <span>{document.label}</span>
            {documents[document.field]
              ? <span className="file-chip">{documents[document.field].name}<button type="button" onClick={() => removeDocument(document.field)} aria-label={`Remove ${document.label}`}>×</button></span>
              : <label className="button secondary small file-upload-label">
                  + Upload document
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => attachDocument(document.field, event)} hidden />
                </label>}
          </div>)}
        </div>
        {error && <div className="error-box">{error}</div>}
        <button className="button primary full large" type="submit" disabled={submitting}>{submitting ? 'Screening documents with AI...' : 'Submit company for verification'}</button>
      </form>
      <Link to="/login" className="back-link">Already registered? Sign in</Link>
    </div>
  </div>
}
