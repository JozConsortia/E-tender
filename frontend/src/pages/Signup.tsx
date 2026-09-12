import { ChangeEvent, FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const requiredDocuments = ['Company Registration', 'Tax Compliance Certificate', 'B-BBEE Certificate']

export default function Signup() {
  const { registerApplicant } = useApp()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [organisation, setOrganisation] = useState('')
  const [director, setDirector] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [documents, setDocuments] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (requiredDocuments.some((document) => !documents[document])) {
      setError('Attach each required company document before submitting for review.')
      return
    }
    const result = await registerApplicant({ name, email, password, organisation, director, documents: requiredDocuments.map((document) => documents[document]) })
    if (!result.ok) { setError(result.message ?? 'Registration could not be completed.'); return }
    navigate('/login', { state: { message: 'Registration submitted. Your company must be approved before you can apply for tenders.' } })
  }

  const attachDocument = (document: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) setDocuments((current) => ({ ...current, [document]: file.name }))
    event.target.value = ''
  }
  const removeDocument = (document: string) => setDocuments((current) => { const next = { ...current }; delete next[document]; return next })

  return <div className="login-page">
    <div className="login-panel signup-panel">
      <Link to="/" className="brand"><span className="brand-mark logo-mark"><img src="/mpumalanga-logo.jpeg" alt="Mpumalanga Provincial Government" /></span><span><strong>Mpumalanga Provincial Treasury</strong><small>Procurement Portal</small></span></Link>
      <div className="login-copy"><span className="eyebrow">Supplier onboarding</span><h1>Register your company.</h1><p>Submit your company details and supporting documents for verification before responding to tenders.</p></div>
      <form onSubmit={submit} className="login-form">
        <label>Contact name<input value={name} onChange={(event) => setName(event.target.value)} required /></label>
        <label>Company name<input value={organisation} onChange={(event) => setOrganisation(event.target.value)} required /></label>
        <label>Company director<input value={director} onChange={(event) => setDirector(event.target.value)} required placeholder="Director listed for the applying company" /></label>
        <label>Email address<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required /></label>
        <label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={8} required /></label>
        <div className="upload-box">
          <strong>Company documents</strong>
          <small>Upload each document below (PDF, JPG or PNG). The file name is recorded against your registration for verification.</small>
          {requiredDocuments.map((document) => <div className="attach-row" key={document}>
            <span>{document}</span>
            {documents[document]
              ? <span className="file-chip">{documents[document]}<button type="button" onClick={() => removeDocument(document)} aria-label={`Remove ${document}`}>×</button></span>
              : <label className="button secondary small file-upload-label">
                  + Upload document
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => attachDocument(document, event)} hidden />
                </label>}
          </div>)}
        </div>
        {error && <div className="error-box">{error}</div>}
        <button className="button primary full large" type="submit">Submit company for verification</button>
      </form>
      <Link to="/login" className="back-link">Already registered? Sign in</Link>
    </div>
  </div>
}
