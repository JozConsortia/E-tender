import { Link } from 'react-router-dom'
import { roleLabel, useApp } from '../context/AppContext'
export default function Forbidden() {
  const { currentUser } = useApp()
  return <div className="center-page"><div className="card narrow"><span className="eyebrow">403 · Access restricted</span><h1>That workspace is outside your role.</h1><p>{currentUser ? `You are signed in as ${roleLabel(currentUser.role)}. Sign out and choose the role responsible for the workspace you need.` : 'Sign in with an authorised role to continue.'}</p><div className="form-actions"><Link className="button secondary" to="/">Return home</Link><Link className="button primary" to="/login">Switch role</Link></div></div></div>
}
