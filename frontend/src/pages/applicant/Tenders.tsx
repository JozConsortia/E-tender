import { Link } from 'react-router-dom'
import { isTenderOpenForApplications, useApp } from '../../context/AppContext'
import { EmptyState, PageHeader } from '../../components/Ui'

export default function Tenders() {
  const { tenders } = useApp()
  const openTenders = tenders.filter(isTenderOpenForApplications)

  return <>
    <PageHeader title="Available tenders" description="Applicants can view published opportunities and submit their own applications. Internal evaluation work is not visible here." />
    {openTenders.length ? <div className="tender-grid">{openTenders.map((tender) => <div className="tender-card" key={tender.id}>
      <span className="eyebrow">{tender.reference}</span>
      <h3>{tender.title}</h3>
      <p>{tender.description}</p>
      <div className="tender-meta">
        <span><b>Department</b>{tender.department}</span>
        <span><b>Closing</b>{new Date(tender.closingDate).toLocaleString('en-ZA')}</span>
        <span><b>Requirements</b>{tender.requirements.length}</span>
      </div>
      <Link className="button primary full" to={`/applicant/tenders/${tender.id}`}>View and apply</Link>
    </div>)}</div> : <EmptyState title="No tenders currently open" message="Published opportunities will appear here while the application window is open." />}
  </>
}
