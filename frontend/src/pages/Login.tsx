import { FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Login() {
  const { login } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const state = location.state as { message?: string; variant?: 'error' | 'success' } | null
  const message = state?.message

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const result = await login(email, password)
    if (!result.ok) { setError(result.message ?? 'Login failed'); return }
    const role = result.user?.role ?? 'APPLICANT'
    const defaultRoute = role === 'ADMIN' ? '/admin' : role === 'APPLICANT' ? '/applicant/tenders' : role === 'BEC' ? '/bec' : role === 'BAC' ? '/bac' : role === 'APPROVER' ? '/approver' : '/auditor'
    navigate((location.state as { from?: string } | null)?.from ?? defaultRoute, { replace: true })
  }

  return <div className="login-page">
    <div className="login-panel">
      <Link to="/" className="brand"><span className="brand-mark logo-mark"><img src="/mpumalanga-logo.jpeg" alt="Mpumalanga Provincial Government" /></span><span><strong>Mpumalanga Provincial Treasury</strong><small>Procurement Portal</small></span></Link>
      <div className="login-copy"><span className="eyebrow">Secure access</span><h1>Sign in to your workspace.</h1><p>Enter your credentials to access your authorised procurement workspace.</p></div>
      <form onSubmit={submit} className="login-form">
        <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoFocus /></label>
        <label>Password<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required /></label>
        {error && <div className="error-box">{error}</div>}
        {message && <div className={state?.variant === 'error' ? 'error-box' : 'success-box'}>{message}</div>}
        <button className="button primary full large" type="submit">Sign in</button>
      </form>
      <Link to="/signup" className="button secondary full">Register as a supplier</Link>
      <Link to="/" className="back-link">← Back to landing page</Link>
    </div>
  </div>
}
