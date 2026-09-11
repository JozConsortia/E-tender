import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { roleLabel, useApp } from '../context/AppContext'
import { NotificationBell } from './NotificationBell'

const navByRole = {
  ADMIN: [
    ['Dashboard', '/admin'],
    ['Tenders', '/admin/tenders'],
    ['Create Tender', '/admin/tenders/create'],
    ['Company Verification', '/admin/companies'],
    ['Document Assessment', '/admin/documents'],
    ['Security Alerts', '/admin/alerts'],
    ['Audit Logs', '/admin/audit'],
  ],
  APPLICANT: [
    ['Available Tenders', '/applicant/tenders'],
    ['My Applications', '/applicant/applications'],
    ['Outcomes', '/applicant/outcomes'],
  ],
  BEC: [
    ['Evaluation Register', '/bec'],
  ],
  BAC: [
    ['Adjudication Register', '/bac'],
  ],
  APPROVER: [
    ['Approval Register', '/approver'],
  ],
  AUDITOR: [
    ['Audit Dashboard', '/auditor'],
    ['Audit Trail', '/auditor/audit'],
  ],
} as const

export function Layout() {
  const { currentUser, logout } = useApp()
  const navigate = useNavigate()
  if (!currentUser) return <Outlet />
  const items = navByRole[currentUser.role]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to={items[0]?.[1] ?? '/'}>
          <span className="brand-mark logo-mark"><img src="/mpumalanga-logo.jpeg" alt="Mpumalanga Provincial Government" /></span>
          <span><strong>Mpumalanga Provincial Treasury</strong><small>Procurement Portal</small></span>
        </Link>
        <div className="role-chip"><span className="status-dot" />{roleLabel(currentUser.role)}</div>
        <nav className="side-nav">
          {items.map(([label, to]) => <NavLink key={to} to={to} end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>{label}</NavLink>)}
        </nav>
        <div className="sidebar-footer">
          <div className="user-mini">
            <div className="avatar">{currentUser.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</div>
            <div><strong>{currentUser.name}</strong><small>{currentUser.email}</small></div>
          </div>
          <button className="button ghost full" onClick={() => { logout(); navigate('/login') }}>Sign out</button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div><span className="eyebrow">Electronic tendering platform</span><h1>{roleLabel(currentUser.role)}</h1></div>
          <div className="topbar-meta">{currentUser.role === 'ADMIN' && <NotificationBell />}<span className="secure-badge">● Strict role workspace</span></div>
        </header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  )
}
