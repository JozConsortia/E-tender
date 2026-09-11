import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export function NotificationBell() {
  const { alerts } = useApp()
  const count = alerts.length
  const highest = alerts.some((a) => a.severity === 'HIGH') ? 'high' : alerts.length ? 'medium' : 'none'

  return (
    <Link to="/admin/alerts" className={`notification-bell ${highest}`} aria-label={`${count} unresolved security alerts`}>
      <span className="bell-icon">🔔</span>
      {count > 0 && <span className="bell-badge">{count > 9 ? '9+' : count}</span>}
    </Link>
  )
}
