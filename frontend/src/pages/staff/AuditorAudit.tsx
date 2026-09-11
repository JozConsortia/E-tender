import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { PageHeader } from '../../components/Ui'

export default function AuditorAudit() {
	const { auditLogs } = useApp()
	const [query, setQuery] = useState('')
	const filtered = useMemo(() => auditLogs.filter((log) => `${log.time} ${log.actor} ${log.action} ${log.target}`.toLowerCase().includes(query.toLowerCase())), [auditLogs, query])

	return <>
		<PageHeader title="Audit trail" description="Read-only chronological activity history for procurement actions." />
		<div className="card audit-tools"><label>Search audit events<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search actor, action, reference..." /></label><span className="muted">{filtered.length} of {auditLogs.length} events</span></div>
		{filtered.length ? <div className="timeline">{filtered.map((log) => <div className="timeline-item" key={log.id}><span className="timeline-dot" /><div><small>{log.time}</small><strong>{log.action}</strong><p>{log.actor} · {log.target}</p></div></div>)}</div> : <div className="empty-state"><h3>No matching events</h3><p>Try a different actor, action, or reference.</p></div>}
	</>
}
