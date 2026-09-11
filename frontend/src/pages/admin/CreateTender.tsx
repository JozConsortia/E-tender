import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { PageHeader } from '../../components/Ui'

const defaultClosingDate = () => {
  const inMonth = new Date()
  inMonth.setMonth(inMonth.getMonth() + 1)
  return inMonth.toISOString().slice(0, 16)
}

export default function CreateTender() {
  const { createTender } = useApp()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [department, setDepartment] = useState('')
  const [description, setDescription] = useState('')
  const [closingDate, setClosingDate] = useState(defaultClosingDate())
  const [requirements, setRequirements] = useState([
    { title: 'Company Registration', mandatory: true },
    { title: 'Tax Compliance Documentation', mandatory: true },
    { title: 'Technical Proposal', mandatory: true },
    { title: 'Financial Proposal', mandatory: true },
  ])
  const [criteria, setCriteria] = useState([{ title: 'Technical Capability', weight: 40 }, { title: 'Price', weight: 30 }, { title: 'Experience', weight: 20 }, { title: 'Preference / Approved Criteria', weight: 10 }])
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!requirements.every((requirement) => requirement.title.trim()) || !criteria.every((criterion) => criterion.title.trim()) || criteria.reduce((sum, criterion) => sum + criterion.weight, 0) !== 100) {
      setError('Add valid requirements and criteria with a total weighting of exactly 100%.')
      return
    }
    const result = await createTender({
      title,
      department,
      description,
      closingDate,
      requirements: requirements.map((r, i) => ({ id: `req-${i}`, title: r.title, mandatory: r.mandatory })),
      criteria: criteria.map((c, i) => ({ id: `crit-${i}`, title: c.title, weight: c.weight, maxScore: c.weight })),
    })
    if (!result.ok) {
      setError(result.message ?? 'The tender could not be created. Check the details above and try again.')
      return
    }
    navigate('/admin/tenders')
  }

  return <><PageHeader title="Create tender" description="The administrator publishes the approved tender package, requirements and evaluation criteria." />
    <form className="card form-card" onSubmit={submit}>
      <div className="form-grid two"><label>Tender title<input value={title} onChange={e => setTitle(e.target.value)} required minLength={3} placeholder="e.g. Supply of ICT Equipment"/></label><label>Department<input value={department} onChange={e => setDepartment(e.target.value)} required minLength={2} placeholder="e.g. Information Technology"/></label><label className="span-2">Description<textarea value={description} onChange={e => setDescription(e.target.value)} required minLength={10} rows={4} placeholder="Describe the procurement requirement..."/></label><label>Closing date and time<input type="datetime-local" value={closingDate} onChange={e => setClosingDate(e.target.value)} required min={new Date().toISOString().slice(0, 16)}/></label></div>
      <div className="form-section"><div className="section-heading"><div><h3>Mandatory requirements</h3><p>Mandatory requirements must be supported by a document before an applicant can submit. Optional requirements are informational only.</p></div><button type="button" className="button secondary small" onClick={() => setRequirements([...requirements, { title: 'New requirement', mandatory: true }])}>+ Add</button></div>{requirements.map((r, i) => <div className="dynamic-row" key={i}><input value={r.title} onChange={e => setRequirements(requirements.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))}/><label className="inline-checkbox"><input type="checkbox" checked={r.mandatory} onChange={e => setRequirements(requirements.map((x, idx) => idx === i ? { ...x, mandatory: e.target.checked } : x))}/> Mandatory</label>{requirements.length > 1 && <button type="button" className="button secondary small" onClick={() => setRequirements(requirements.filter((_, idx) => idx !== i))}>Remove</button>}</div>)}</div>
      <div className="form-section"><div className="section-heading"><div><h3>Evaluation criteria</h3><p>Scoring totals must equal 100% before publication.</p></div><button type="button" className="button secondary small" onClick={() => setCriteria([...criteria, { title: 'New criterion', weight: 0 }])}>+ Add</button></div>{criteria.map((c, i) => <div className="dynamic-row" key={i}><input value={c.title} onChange={e => setCriteria(criteria.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))}/><input className="weight-input" type="number" min={0} max={100} value={c.weight} onChange={e => setCriteria(criteria.map((x, idx) => idx === i ? { ...x, weight: Number(e.target.value) } : x))}/><span>%</span>{criteria.length > 1 && <button type="button" className="button secondary small" onClick={() => setCriteria(criteria.filter((_, idx) => idx !== i))}>Remove</button>}</div>)}<div className="weight-total">Total weight: <strong>{criteria.reduce((sum, c) => sum + c.weight, 0)}%</strong></div></div>
      {error && <div className="error-box">{error}</div>}<div className="form-actions"><button type="button" className="button secondary" onClick={() => navigate('/admin/tenders')}>Cancel</button><button type="submit" className="button primary">Save tender as draft</button></div>
    </form></>
}
