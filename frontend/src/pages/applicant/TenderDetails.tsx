import { ChangeEvent, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { isTenderOpenForApplications, isTenderPastClosing, useApp } from '../../context/AppContext'
import { PageHeader, StatusBadge } from '../../components/Ui'
import type { Sbd4Form, Sbd61Form, Sbd62Form, Sbd8Form, Sbd9Form } from '../../types'

const TABS = [
  { key: 'company', label: 'Company and price' },
  { key: 'specification', label: 'Specification' },
  { key: 'sbd4', label: 'SBD 4' },
  { key: 'sbd61', label: 'SBD 6.1' },
  { key: 'sbd62', label: 'SBD 6.2' },
  { key: 'sbd8', label: 'SBD 8' },
  { key: 'sbd9', label: 'SBD 9' },
  { key: 'review', label: 'Review and submit' },
] as const
type TabKey = typeof TABS[number]['key']

const emptySbd4 = (): Sbd4Form => ({
  fullName: '', idNumber: '', position: '', companyRegNumber: '', taxRefNumber: '', vatRegNumber: '',
  persons: [], employedByState: null, conductedBusinessWithState: null, relationshipWithStateEvaluator: null,
  awareOfOtherBidderRelationship: null, interestInOtherBidders: null, declarationSignedBy: '', declarationPosition: '',
  declarationDate: '', declarationCertified: false,
})
const emptySbd61 = (): Sbd61Form => ({
  bbeeStatusLevel: '', proofAttached: '', pointsClaimed: '', subcontracting: null, companyName: '', vatNumber: '',
  companyRegNumber: '', companyType: 'Company', companyClassification: 'Supplier', yearsInBusiness: '',
  principalBusinessActivities: '', certified: false,
})
const emptySbd62 = (): Sbd62Form => ({ hasImportedContent: null, bidPriceExclVat: '', importedContentRand: '', declaredByName: '', declaredByCapacity: '', certified: false })
const emptySbd8 = (): Sbd8Form => ({
  convictedFraudCorruption: null, listedTenderDefaulters: null, contractTerminatedPoorPerformance: null,
  restrictedFromBidding: null, details: '', declaredByName: '', declaredByPosition: '', certified: false,
})
const emptySbd9 = (): Sbd9Form => ({
  acknowledgeDisqualification: false, authorisedToSign: false, arrivedIndependently: false, noConsultation: false,
  termsNotDisclosed: false, signedByName: '', signedByPosition: '', finalCertification: false,
})

const YesNo = ({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) => (
  <div className="yesno-group">
    <label className={value === true ? 'yesno-option active' : 'yesno-option'}><input type="radio" checked={value === true} onChange={() => onChange(true)} /> Yes</label>
    <label className={value === false ? 'yesno-option active' : 'yesno-option'}><input type="radio" checked={value === false} onChange={() => onChange(false)} /> No</label>
  </div>
)

export default function TenderDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { tenders, applications, submitApplication, currentUser } = useApp()
  const tender = tenders.find((item) => item.id === id)
  const already = useMemo(() => applications.some((application) => application.tenderId === id && application.applicantId === currentUser?.id), [applications, id, currentUser?.id])
  const verified = currentUser?.verificationStatus === 'APPROVED'

  const [activeTab, setActiveTab] = useState<TabKey>('company')
  const [files, setFiles] = useState<Record<string, string>>({})
  const [quotationFiles, setQuotationFiles] = useState<string[]>([])
  const [bidSummary, setBidSummary] = useState('')
  const [technicalApproach, setTechnicalApproach] = useState('')
  const [deliveryTimeline, setDeliveryTimeline] = useState('')
  const [pricingAmount, setPricingAmount] = useState('')
  const [complianceDeclaration, setComplianceDeclaration] = useState(false)
  const [companyRegNumber, setCompanyRegNumber] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [specification, setSpecification] = useState<Record<string, string>>({})
  const [sbd4, setSbd4] = useState<Sbd4Form>(emptySbd4())
  const [sbd61, setSbd61] = useState<Sbd61Form>(emptySbd61())
  const [sbd62, setSbd62] = useState<Sbd62Form>(emptySbd62())
  const [sbd8, setSbd8] = useState<Sbd8Form>(emptySbd8())
  const [sbd9, setSbd9] = useState<Sbd9Form>(emptySbd9())
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!tender) return <div className="empty-state"><h3>Tender not found</h3><p>The tender may have been removed from the public application list.</p></div>

  const open = isTenderOpenForApplications(tender)
  const pastClosing = isTenderPastClosing(tender)
  const canApply = verified && open && !already

  const attach = (requirementId: string, title: string) => setFiles((current) => ({ ...current, [requirementId]: `${title.trim().replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '')}.pdf` }))
  const detach = (requirementId: string) => setFiles((current) => { const next = { ...current }; delete next[requirementId]; return next })

  const attachQuotation = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? [])
    if (picked.length) setQuotationFiles((current) => [...current, ...picked.map((f) => f.name)])
    event.target.value = ''
  }
  const removeQuotation = (name: string) => setQuotationFiles((current) => current.filter((f) => f !== name))

  const localContent = useMemo(() => {
    const y = Number(sbd62.bidPriceExclVat)
    const x = Number(sbd62.importedContentRand)
    if (!y || !Number.isFinite(y) || !Number.isFinite(x)) return null
    return Math.max(0, Math.round((1 - x / y) * 10000) / 100)
  }, [sbd62.bidPriceExclVat, sbd62.importedContentRand])

  const companyComplete = Boolean(companyRegNumber.trim() && vatNumber.trim() && deliveryTimeline.trim() && Number(pricingAmount) > 0)
  const specificationComplete = bidSummary.trim().length >= 20 && technicalApproach.trim().length >= 20
    && tender.requirements.filter((r) => r.mandatory).every((r) => files[r.id])
  const sbd4Complete = sbd4.employedByState !== null && sbd4.conductedBusinessWithState !== null && sbd4.relationshipWithStateEvaluator !== null
    && sbd4.awareOfOtherBidderRelationship !== null && sbd4.interestInOtherBidders !== null
    && sbd4.declarationSignedBy.trim() && sbd4.declarationPosition.trim() && sbd4.declarationCertified
  const sbd61Complete = Boolean(sbd61.bbeeStatusLevel && sbd61.proofAttached && sbd61.subcontracting !== null && sbd61.companyName.trim() && sbd61.certified)
  const sbd62Complete = sbd62.hasImportedContent !== null && (sbd62.hasImportedContent === false || (sbd62.bidPriceExclVat && sbd62.importedContentRand))
    && Boolean(sbd62.declaredByName.trim() && sbd62.declaredByCapacity.trim() && sbd62.certified)
  const sbd8Complete = sbd8.convictedFraudCorruption !== null && sbd8.listedTenderDefaulters !== null && sbd8.contractTerminatedPoorPerformance !== null
    && sbd8.restrictedFromBidding !== null && Boolean(sbd8.declaredByName.trim() && sbd8.declaredByPosition.trim() && sbd8.certified)
  const sbd9Complete = sbd9.acknowledgeDisqualification && sbd9.authorisedToSign && sbd9.arrivedIndependently && sbd9.noConsultation
    && sbd9.termsNotDisclosed && Boolean(sbd9.signedByName.trim() && sbd9.signedByPosition.trim()) && sbd9.finalCertification

  const sections = [
    { key: 'company' as const, label: 'Company and price', summary: `${currentUser?.organisation ?? ''} · R ${pricingAmount || 0}`, complete: companyComplete },
    { key: 'specification' as const, label: 'Specification', summary: `${Object.values(specification).filter(Boolean).length} of ${tender.requirements.length} attributes answered`, complete: specificationComplete },
    { key: 'sbd4' as const, label: 'SBD 4 declaration of interest', summary: `${sbd4.persons.length} people listed`, complete: sbd4Complete },
    { key: 'sbd61' as const, label: 'SBD 6.1 preference points claim', summary: sbd61.bbeeStatusLevel ? `${sbd61.bbeeStatusLevel} claimed` : 'Not claimed', complete: sbd61Complete },
    { key: 'sbd62' as const, label: 'SBD 6.2 local production and content', summary: localContent !== null ? `${localContent}% local content` : 'Not calculated', complete: sbd62Complete },
    { key: 'sbd8' as const, label: 'SBD 8 past supply chain practices', summary: sbd8.certified ? 'Declared' : 'Nothing declared', complete: sbd8Complete },
    { key: 'sbd9' as const, label: 'SBD 9 independent bid determination', summary: sbd9.finalCertification ? 'Certified' : 'Not certified', complete: sbd9Complete },
  ]
  const allComplete = sections.every((s) => s.complete) && complianceDeclaration

  const goto = (key: TabKey) => { setActiveTab(key); setError('') }
  const tabIndex = TABS.findIndex((t) => t.key === activeTab)
  const goNext = () => { if (tabIndex < TABS.length - 1) goto(TABS[tabIndex + 1].key) }
  const goBack = () => { if (tabIndex > 0) goto(TABS[tabIndex - 1].key) }

  const submit = async () => {
    if (!allComplete) { setError('Complete every section, including the compliance declaration, before submitting.'); return }
    const documents = Object.values(files)
    if (!documents.length) { setError('Attach at least one supporting document for AI validation.'); return }
    const price = Number(pricingAmount)

    setSubmitting(true)
    const result = await submitApplication({
      tenderId: tender.id,
      companyName: currentUser?.organisation ?? '',
      documents,
      bidSummary: bidSummary.trim(),
      technicalApproach: technicalApproach.trim(),
      deliveryTimeline: deliveryTimeline.trim(),
      pricingAmount: price,
      complianceDeclaration,
      quotationDocuments: quotationFiles,
      sbdForm: { companyPrice: { companyRegNumber, vatNumber }, specification, sbd4, sbd61, sbd62, sbd8, sbd9 },
    })
    setSubmitting(false)
    if (!result.ok) { setError(result.message ?? 'Your application could not be submitted.'); return }
    navigate('/applicant/outcomes')
  }

  const disabled = !canApply

  const WizardNav = () => (
    <div className="form-actions">
      {tabIndex > 0 && <button type="button" className="button secondary" onClick={goBack}>Back</button>}
      {activeTab !== 'review'
        ? <button type="button" className="button primary" onClick={goNext}>Continue</button>
        : <button type="button" className="button primary" onClick={submit} disabled={!canApply || submitting}>{submitting ? 'Submitting...' : 'Submit bid'}</button>}
      <button type="button" className="button secondary" onClick={() => navigate('/applicant/tenders')}>Leave without submitting</button>
    </div>
  )

  return <>
    <PageHeader title={tender.title} description={`${tender.reference} · closes ${new Date(tender.closingDate).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}`} action={<button className="button secondary" onClick={() => navigate('/applicant/tenders')}>Back to tenders</button>} />

    {already && <div className="success-box" style={{ marginBottom: 16 }}>You already submitted this tender. The final outcome will appear in Outcomes.</div>}
    {!verified && <div className="notice warning"><strong>Verification required</strong><span>An administrator must approve your company before you can submit a bid.</span></div>}
    {pastClosing && tender.status !== 'CANCELLED' && <div className="notice warning"><strong>Application window closed</strong><span>This tender closed on {new Date(tender.closingDate).toLocaleString('en-ZA')}.</span></div>}

    <div className="wizard-tabs">
      {TABS.map((tab) => <button key={tab.key} type="button" className={activeTab === tab.key ? 'wizard-tab active' : 'wizard-tab'} onClick={() => goto(tab.key)}>{tab.label}</button>)}
    </div>

    <div className="card form-card wizard-panel">
      {activeTab === 'company' && <>
        <h3>Company and price</h3>
        <p className="muted">Confirm the applying company's details and bid pricing.</p>
        <div className="form-grid two">
          <label>Applying company<input value={currentUser?.organisation ?? ''} disabled readOnly /></label>
          <label>Total price excl. VAT (ZAR)<input type="number" min="0" step="0.01" value={pricingAmount} onChange={(e) => setPricingAmount(e.target.value)} disabled={disabled} placeholder="e.g. 450000" /></label>
          <label>Company registration number<input value={companyRegNumber} onChange={(e) => setCompanyRegNumber(e.target.value)} disabled={disabled} placeholder="e.g. 2021/456789/07" /></label>
          <label>VAT registration number<input value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} disabled={disabled} placeholder="e.g. 4230198765" /></label>
          <label className="span-2">Delivery timeline<input value={deliveryTimeline} onChange={(e) => setDeliveryTimeline(e.target.value)} disabled={disabled} placeholder="e.g. 8 weeks from award" /></label>
        </div>
        <div className="form-section">
          <div className="section-heading"><div><h3>Quotations</h3><p>Upload supporting price quotations (PDF, JPG or PNG). Optional but recommended.</p></div></div>
          <div className="upload-box">
            {quotationFiles.map((name) => <div className="attach-row" key={name}><span>{name}</span><span className="file-chip">{name}<button type="button" onClick={() => removeQuotation(name)} disabled={disabled} aria-label={`Remove ${name}`}>×</button></span></div>)}
            <label className="button secondary small file-upload-label">+ Upload quotation<input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={attachQuotation} hidden disabled={disabled} /></label>
          </div>
        </div>
      </>}

      {activeTab === 'specification' && <>
        <h3>Specification</h3>
        <p className="muted">{tender.description}</p>
        <label>Bid summary<textarea rows={3} value={bidSummary} onChange={(e) => setBidSummary(e.target.value)} disabled={disabled} placeholder="Summarise your understanding of the requirement and your proposed solution." /></label>
        <label>Technical approach<textarea rows={4} value={technicalApproach} onChange={(e) => setTechnicalApproach(e.target.value)} disabled={disabled} placeholder="Describe how you will deliver against the published requirements and criteria." /></label>
        <div className="form-section">
          <div className="section-heading"><div><h3>Answer every line</h3><p>A blank answer or missing document on a mandatory item fails that item and takes the bid out of evaluation.</p></div></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Item</th><th>Required</th><th>Your offer</th><th>Evidence</th></tr></thead>
              <tbody>{tender.requirements.map((requirement) => <tr key={requirement.id}>
                <td>{requirement.title}</td>
                <td><StatusBadge tone={requirement.mandatory ? 'warning' : 'neutral'}>{requirement.mandatory ? 'Mandatory' : 'Optional'}</StatusBadge></td>
                <td><input value={specification[requirement.id] ?? ''} onChange={(e) => setSpecification((c) => ({ ...c, [requirement.id]: e.target.value }))} disabled={disabled} placeholder="Describe your offer" /></td>
                <td>{files[requirement.id]
                  ? <span className="file-chip">{files[requirement.id]}<button type="button" onClick={() => detach(requirement.id)} disabled={disabled} aria-label={`Remove ${requirement.title} document`}>×</button></span>
                  : <button type="button" className="button secondary small" onClick={() => attach(requirement.id, requirement.title)} disabled={disabled}>+ Attach document</button>}
                </td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>
      </>}

      {activeTab === 'sbd4' && <>
        <h3>SBD 4 — Declaration of interest</h3>
        <p className="muted">Any person employed by the state, or related to someone employed by the state, may bid. What the law requires is that you declare it, so the evaluating authority can see the relationship.</p>
        <div className="form-grid two">
          <label>2.1 Full name of bidder or representative<input value={sbd4.fullName} onChange={(e) => setSbd4({ ...sbd4, fullName: e.target.value })} disabled={disabled} /></label>
          <label>2.2 Identity number<input value={sbd4.idNumber} onChange={(e) => setSbd4({ ...sbd4, idNumber: e.target.value })} disabled={disabled} /></label>
          <label>2.3 Position occupied in the company<input value={sbd4.position} onChange={(e) => setSbd4({ ...sbd4, position: e.target.value })} disabled={disabled} placeholder="Director, trustee, shareholder" /></label>
          <label>2.4 Company registration number<input value={sbd4.companyRegNumber} onChange={(e) => setSbd4({ ...sbd4, companyRegNumber: e.target.value })} disabled={disabled} /></label>
          <label>2.5 Tax reference number<input value={sbd4.taxRefNumber} onChange={(e) => setSbd4({ ...sbd4, taxRefNumber: e.target.value })} disabled={disabled} /></label>
          <label>2.6 VAT registration number<input value={sbd4.vatRegNumber} onChange={(e) => setSbd4({ ...sbd4, vatRegNumber: e.target.value })} disabled={disabled} /></label>
        </div>

        <div className="form-section">
          <div className="section-heading"><div><h3>3. Full details of directors, trustees, members or shareholders</h3></div>
            <button type="button" className="button secondary small" disabled={disabled} onClick={() => setSbd4({ ...sbd4, persons: [...sbd4.persons, { fullName: '', idNumber: '', taxRef: '', stateEmployeeNumber: '' }] })}>+ Add a person</button>
          </div>
          {sbd4.persons.map((person, i) => <div className="form-grid two" key={i} style={{ marginBottom: 10 }}>
            <label>Full name<input value={person.fullName} onChange={(e) => setSbd4({ ...sbd4, persons: sbd4.persons.map((p, idx) => idx === i ? { ...p, fullName: e.target.value } : p) })} disabled={disabled} /></label>
            <label>Identity number<input value={person.idNumber} onChange={(e) => setSbd4({ ...sbd4, persons: sbd4.persons.map((p, idx) => idx === i ? { ...p, idNumber: e.target.value } : p) })} disabled={disabled} /></label>
            <label>Personal tax reference<input value={person.taxRef} onChange={(e) => setSbd4({ ...sbd4, persons: sbd4.persons.map((p, idx) => idx === i ? { ...p, taxRef: e.target.value } : p) })} disabled={disabled} /></label>
            <label>State employee or persal number<input value={person.stateEmployeeNumber} onChange={(e) => setSbd4({ ...sbd4, persons: sbd4.persons.map((p, idx) => idx === i ? { ...p, stateEmployeeNumber: e.target.value } : p) })} disabled={disabled} placeholder="If applicable" /></label>
          </div>)}
        </div>

        <div className="form-section">
          <div className="score-row"><span>2.7 Are you or any person connected with the bidder presently employed by the state?</span><YesNo value={sbd4.employedByState} onChange={(v) => setSbd4({ ...sbd4, employedByState: v })} /></div>
          <div className="score-row"><span>2.8 Did you, your spouse, or any director/trustee/shareholder/member conduct business with the state in the previous twelve months?</span><YesNo value={sbd4.conductedBusinessWithState} onChange={(v) => setSbd4({ ...sbd4, conductedBusinessWithState: v })} /></div>
          <div className="score-row"><span>2.9 Do you have any relationship with a person employed by the state who may be involved with the evaluation or adjudication of this bid?</span><YesNo value={sbd4.relationshipWithStateEvaluator} onChange={(v) => setSbd4({ ...sbd4, relationshipWithStateEvaluator: v })} /></div>
          <div className="score-row"><span>2.10 Are you aware of any relationship between any other bidder and a person employed by the state who may be involved with the evaluation of this bid?</span><YesNo value={sbd4.awareOfOtherBidderRelationship} onChange={(v) => setSbd4({ ...sbd4, awareOfOtherBidderRelationship: v })} /></div>
          <div className="score-row"><span>2.11 Do you or any director/trustee/shareholder/member have any interest in any other related companies bidding for this contract?</span><YesNo value={sbd4.interestInOtherBidders} onChange={(v) => setSbd4({ ...sbd4, interestInOtherBidders: v })} /></div>
        </div>

        <div className="notice warning"><strong>4. Declaration</strong><span>The state may reject the bid or act in terms of paragraph 23 of the General Conditions of Contract should this declaration prove to be false.</span></div>
        <div className="form-grid two">
          <label>Signed by (full name)<input value={sbd4.declarationSignedBy} onChange={(e) => setSbd4({ ...sbd4, declarationSignedBy: e.target.value })} disabled={disabled} /></label>
          <label>Position<input value={sbd4.declarationPosition} onChange={(e) => setSbd4({ ...sbd4, declarationPosition: e.target.value })} disabled={disabled} /></label>
          <label>Date<input type="date" value={sbd4.declarationDate} onChange={(e) => setSbd4({ ...sbd4, declarationDate: e.target.value })} disabled={disabled} /></label>
        </div>
        <label className="inline-checkbox"><input type="checkbox" checked={sbd4.declarationCertified} onChange={(e) => setSbd4({ ...sbd4, declarationCertified: e.target.checked })} disabled={disabled} /> I certify that the information furnished in paragraphs 2 and 3 above is correct.</label>
      </>}

      {activeTab === 'sbd61' && <>
        <h3>SBD 6.1 — Preference points claim form</h3>
        <p className="muted">A maximum of 80 points is allocated for price and 20 for preference. Failure to submit proof of your B-BBEE status level means preference points are not claimed.</p>
        <div className="form-grid two">
          <label>6.1 B-BBEE status level of contributor<select value={sbd61.bbeeStatusLevel} onChange={(e) => setSbd61({ ...sbd61, bbeeStatusLevel: e.target.value })} disabled={disabled}>
            <option value="">Select level</option>
            {['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6', 'Level 7', 'Level 8', 'Non-compliant'].map((l) => <option key={l} value={l}>{l}</option>)}
          </select></label>
          <label>Proof attached<select value={sbd61.proofAttached} onChange={(e) => setSbd61({ ...sbd61, proofAttached: e.target.value })} disabled={disabled}>
            <option value="">Select</option>
            <option value="B-BBEE status level certificate">B-BBEE status level certificate</option>
            <option value="Sworn affidavit (EME/QSE)">Sworn affidavit (EME/QSE)</option>
            <option value="None">None</option>
          </select></label>
          <label>Points claimed<input value={sbd61.pointsClaimed} onChange={(e) => setSbd61({ ...sbd61, pointsClaimed: e.target.value })} disabled={disabled} placeholder="e.g. 20 of 20" /></label>
        </div>

        <div className="form-section">
          <div className="section-heading"><div><h3>7. Sub-contracting</h3></div></div>
          <div className="score-row"><span>7.1 Will any portion of the contract be sub-contracted?</span><YesNo value={sbd61.subcontracting} onChange={(v) => setSbd61({ ...sbd61, subcontracting: v })} /></div>
        </div>

        <div className="form-section">
          <div className="section-heading"><div><h3>8. Declaration with regard to the company or firm</h3></div></div>
          <div className="form-grid two">
            <label>8.1 Name of company or firm<input value={sbd61.companyName} onChange={(e) => setSbd61({ ...sbd61, companyName: e.target.value })} disabled={disabled} /></label>
            <label>8.2 VAT registration number<input value={sbd61.vatNumber} onChange={(e) => setSbd61({ ...sbd61, vatNumber: e.target.value })} disabled={disabled} /></label>
            <label>8.3 Company registration number<input value={sbd61.companyRegNumber} onChange={(e) => setSbd61({ ...sbd61, companyRegNumber: e.target.value })} disabled={disabled} /></label>
            <label>8.4 Type of company or firm<select value={sbd61.companyType} onChange={(e) => setSbd61({ ...sbd61, companyType: e.target.value })} disabled={disabled}>
              {['Company', 'Close corporation', 'Sole proprietor', 'Partnership', 'Trust'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select></label>
            <label>8.6 Company classification<select value={sbd61.companyClassification} onChange={(e) => setSbd61({ ...sbd61, companyClassification: e.target.value })} disabled={disabled}>
              {['Supplier', 'Manufacturer', 'Service provider', 'Contractor'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select></label>
            <label>8.7 Years the firm has been in business<input value={sbd61.yearsInBusiness} onChange={(e) => setSbd61({ ...sbd61, yearsInBusiness: e.target.value })} disabled={disabled} /></label>
          </div>
          <label>8.5 Principal business activities<textarea rows={2} value={sbd61.principalBusinessActivities} onChange={(e) => setSbd61({ ...sbd61, principalBusinessActivities: e.target.value })} disabled={disabled} /></label>
        </div>
        <label className="inline-checkbox"><input type="checkbox" checked={sbd61.certified} onChange={(e) => setSbd61({ ...sbd61, certified: e.target.checked })} disabled={disabled} /> I certify that the information furnished is true and correct, that the preference points claimed are in accordance with the general conditions of this form, and that a claim obtained on a fraudulent basis may lead to disqualification, cancellation, restriction from public sector business for up to ten years, and criminal prosecution.</label>
      </>}

      {activeTab === 'sbd62' && <>
        <h3>SBD 6.2 — Local production and content</h3>
        <p className="muted">This tender is in a designated sector, so a stipulated minimum of 70% local content applies. Local content is calculated as LC = [1 − x / y] × 100, where x is imported content in rand and y is the bid price excluding VAT.</p>
        <div className="score-row"><span>Does any portion of the goods or services offered have imported content?</span><YesNo value={sbd62.hasImportedContent} onChange={(v) => setSbd62({ ...sbd62, hasImportedContent: v })} /></div>
        <div className="form-grid two">
          <label>Bid price excluding VAT (y)<input type="number" min="0" value={sbd62.bidPriceExclVat} onChange={(e) => setSbd62({ ...sbd62, bidPriceExclVat: e.target.value })} disabled={disabled} /></label>
          <label>Imported content in rand (x)<input type="number" min="0" value={sbd62.importedContentRand} onChange={(e) => setSbd62({ ...sbd62, importedContentRand: e.target.value })} disabled={disabled || sbd62.hasImportedContent === false} /></label>
          <label>Local content calculated<input value={localContent !== null ? `${localContent}%` : '—'} disabled readOnly /></label>
        </div>
        <p className="muted" style={{ marginTop: -8 }}>Converted at the SARB rate at 12:00 on the advertisement date.</p>
        <div className="form-grid two">
          <label>Declared by (full name)<input value={sbd62.declaredByName} onChange={(e) => setSbd62({ ...sbd62, declaredByName: e.target.value })} disabled={disabled} /></label>
          <label>In my capacity as<input value={sbd62.declaredByCapacity} onChange={(e) => setSbd62({ ...sbd62, declaredByCapacity: e.target.value })} disabled={disabled} placeholder="Chief financial officer" /></label>
        </div>
        <label className="inline-checkbox"><input type="checkbox" checked={sbd62.certified} onChange={(e) => setSbd62({ ...sbd62, certified: e.target.checked })} disabled={disabled} /> The facts are within my own personal knowledge, the goods comply with the minimum local content requirements as measured under SATS 1286:2011, and I accept that the procurement authority may require the local content to be verified.</label>
      </>}

      {activeTab === 'sbd8' && <>
        <h3>SBD 8 — Declaration of bidder's past supply chain practices</h3>
        <p className="muted">This declaration is used to assess the bidder's record on the ethical conduct of past supply chain practices.</p>
        <div className="score-row"><span>Has the bidder or any of its directors been convicted of fraud or corruption relating to tenders or contracts in the past five years?</span><YesNo value={sbd8.convictedFraudCorruption} onChange={(v) => setSbd8({ ...sbd8, convictedFraudCorruption: v })} /></div>
        <div className="score-row"><span>Is the bidder or any of its directors listed on the National Treasury's Register for Tender Defaulters?</span><YesNo value={sbd8.listedTenderDefaulters} onChange={(v) => setSbd8({ ...sbd8, listedTenderDefaulters: v })} /></div>
        <div className="score-row"><span>Was any contract between the bidder and an organ of state terminated in the past five years due to poor performance?</span><YesNo value={sbd8.contractTerminatedPoorPerformance} onChange={(v) => setSbd8({ ...sbd8, contractTerminatedPoorPerformance: v })} /></div>
        <div className="score-row"><span>Is the bidder or any of its directors currently restricted from doing business with the public sector?</span><YesNo value={sbd8.restrictedFromBidding} onChange={(v) => setSbd8({ ...sbd8, restrictedFromBidding: v })} /></div>
        <label>If you answered "Yes" to any question above, provide details<textarea rows={3} value={sbd8.details} onChange={(e) => setSbd8({ ...sbd8, details: e.target.value })} disabled={disabled} /></label>
        <div className="form-grid two">
          <label>Declared by (full name)<input value={sbd8.declaredByName} onChange={(e) => setSbd8({ ...sbd8, declaredByName: e.target.value })} disabled={disabled} /></label>
          <label>Position<input value={sbd8.declaredByPosition} onChange={(e) => setSbd8({ ...sbd8, declaredByPosition: e.target.value })} disabled={disabled} /></label>
        </div>
        <label className="inline-checkbox"><input type="checkbox" checked={sbd8.certified} onChange={(e) => setSbd8({ ...sbd8, certified: e.target.checked })} disabled={disabled} /> I certify that the information furnished in this declaration is true and correct, and understand that any false declaration is grounds for disqualification or cancellation of the contract.</label>
      </>}

      {activeTab === 'sbd9' && <>
        <h3>SBD 9 — Certificate of independent bid determination</h3>
        <p className="muted">Collusive bidding is prohibited outright under the Competition Act and cannot be justified on any grounds. This certificate is what you are signing against.</p>
        <div className="notice info"><span>In respect of <strong>{tender.reference}</strong> — {tender.title}, invited by {tender.department}, certified on behalf of <strong>{currentUser?.organisation}</strong>.</span></div>
        <label className="inline-checkbox"><input type="checkbox" checked={sbd9.acknowledgeDisqualification} onChange={(e) => setSbd9({ ...sbd9, acknowledgeDisqualification: e.target.checked })} disabled={disabled} /> I have read and I understand the contents of this certificate, and I understand that the bid will be disqualified if it is found not to be true and complete in every respect.</label>
        <label className="inline-checkbox"><input type="checkbox" checked={sbd9.authorisedToSign} onChange={(e) => setSbd9({ ...sbd9, authorisedToSign: e.target.checked })} disabled={disabled} /> I am authorised by the bidder to sign this certificate and to submit the accompanying bid on its behalf, and each person whose signature appears on the bid has been authorised to determine its terms and sign it.</label>
        <label className="inline-checkbox"><input type="checkbox" checked={sbd9.arrivedIndependently} onChange={(e) => setSbd9({ ...sbd9, arrivedIndependently: e.target.checked })} disabled={disabled} /> The bidder has arrived at this bid independently from, and without consultation, communication, agreement or arrangement with, any competitor.</label>
        <label className="inline-checkbox"><input type="checkbox" checked={sbd9.noConsultation} onChange={(e) => setSbd9({ ...sbd9, noConsultation: e.target.checked })} disabled={disabled} /> There has been no consultation, communication, agreement or arrangement with any competitor regarding prices, market allocation, pricing methods, the intention to submit a bid, a bid that does not meet the specifications, or bidding with the intention not to win.</label>
        <label className="inline-checkbox"><input type="checkbox" checked={sbd9.termsNotDisclosed} onChange={(e) => setSbd9({ ...sbd9, termsNotDisclosed: e.target.checked })} disabled={disabled} /> The terms of this bid have not been and will not be disclosed to any competitor before the official bid opening or the awarding of the contract.</label>
        <div className="form-grid two">
          <label>Signed by (full name)<input value={sbd9.signedByName} onChange={(e) => setSbd9({ ...sbd9, signedByName: e.target.value })} disabled={disabled} /></label>
          <label>Position<input value={sbd9.signedByPosition} onChange={(e) => setSbd9({ ...sbd9, signedByPosition: e.target.value })} disabled={disabled} /></label>
        </div>
        <label className="inline-checkbox"><input type="checkbox" checked={sbd9.finalCertification} onChange={(e) => setSbd9({ ...sbd9, finalCertification: e.target.checked })} disabled={disabled} /> I certify the statements above to be true and complete in every respect, and I am aware that suspicious bids are reported to the Competition Commission and may be referred for criminal investigation.</label>
      </>}

      {activeTab === 'review' && <>
        <h3>Review and submit</h3>
        <p className="muted">Your bid is time-stamped on submission and stays sealed until {new Date(tender.closingDate).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}.</p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Form</th><th>Summary</th><th></th></tr></thead>
            <tbody>{sections.map((s) => <tr key={s.key}>
              <td>{s.label}</td>
              <td className="muted">{s.summary}</td>
              <td><StatusBadge tone={s.complete ? 'success' : 'warning'}>{s.complete ? 'Complete' : 'Incomplete'}</StatusBadge></td>
            </tr>)}</tbody>
          </table>
        </div>
        <label className="inline-checkbox" style={{ marginTop: 18 }}><input type="checkbox" checked={complianceDeclaration} onChange={(e) => setComplianceDeclaration(e.target.checked)} disabled={disabled} /> I declare that this bid complies with the published tender terms and conditions.</label>
        <div className="notice warning" style={{ marginTop: 14 }}><strong>Final declaration</strong><span>A false declaration on any of these forms is grounds for disqualification, cancellation of the contract, restriction from public sector business, and criminal prosecution.</span></div>
        <div className="notice info"><strong>AI document review</strong><span>The system will validate uploaded evidence, reject unmatched documents, and only send valid requirements to the BEC for review.</span></div>
      </>}

      {error && <div className="error-box" style={{ marginTop: 16 }}>{error}</div>}
      {!already && canApply && <WizardNav />}
      {!canApply && !already && <div className="form-actions"><button type="button" className="button secondary" onClick={() => navigate('/applicant/tenders')}>Back to tenders</button></div>}
    </div>
  </>
}
