import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { EmptyState, PageHeader, StatusBadge } from '../../components/Ui'

const severityTone = (severity: string) => severity === 'HIGH' ? 'danger' as const : severity === 'MEDIUM' ? 'warning' as const : 'neutral' as const

export default function SecurityAlerts() {
  const { alerts, resolveAlert } = useApp()
  const [error, setError] = useState('')

  const resolve = async (id: string) => {
    const result = await resolveAlert(id)
    if (!result.ok) setError(result.message ?? 'The alert could not be resolved.')
  }

  return <>
    <PageHeader title="Security alerts" description="Automated flags for suspicious activity: repeated failed sign-ins, director conflicts of interest, reused evidence, and unusual award patterns." />
    {error && <div className="error-box">{error}</div>}
    {alerts.length ? <div className="alert-list">{alerts.map((alert) => <div className={`card alert-card ${alert.severity.toLowerCase()}`} key={alert.id}>
      <div>
        <div className="alert-meta"><StatusBadge tone={severityTone(alert.severity)}>{alert.severity}</StatusBadge><strong>{alert.type.replace(/_/g, ' ')}</strong></div>
        <p>{alert.message}</p>
        <span className="alert-time">{new Date(alert.createdAt).toLocaleString('en-ZA')}</span>
      </div>
      <button className="button secondary small" onClick={() => resolve(alert.id)}>Mark resolved</button>
    </div>)}</div> : <EmptyState title="No open alerts" message="Automated fraud and misuse detection has not flagged any current activity." />}
  </>
}
