import type { ReactNode } from 'react'

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="page-header"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>
}

export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return <div className="stat-card"><span>{label}</span><strong>{value}</strong>{hint && <small>{hint}</small>}</div>
}

export function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }) {
  return <span className={`status-badge ${tone}`}>{children}</span>
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return <div className="empty-state"><div className="empty-icon">◎</div><h3>{title}</h3><p>{message}</p></div>
}
