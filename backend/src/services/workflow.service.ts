import { applications, auditLogs, tenders } from '../data/store.js'

function log(actor: string, action: string, target: string) {
  auditLogs.unshift({ id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, time: new Date().toLocaleString('en-ZA', { hour12: false }).replace(',', ''), actor, action, target })
}

export function syncTenderLifecycle() {
  for (const tender of tenders) {
    if (tender.status === 'PUBLISHED' && new Date(tender.closingDate).getTime() <= Date.now()) {
      tender.status = 'EVALUATION'
      for (const application of applications.filter((item) => item.tenderId === tender.id && item.status === 'SUBMITTED')) application.status = 'UNDER_EVALUATION'
      log('System', 'Moved tender to evaluation after closing', tender.reference)
    }
    if (tender.status === 'EVALUATION') {
      const related = applications.filter((item) => item.tenderId === tender.id)
      if (related.length > 0 && related.every((item) => ['SHORTLISTED', 'REVIEW_REQUIRED'].includes(item.status))) {
        tender.status = 'ADJUDICATION'
        log('System', 'Completed BEC evaluation stage', tender.reference)
      }
    }
  }
}

export function addAudit(actor: string, action: string, target: string) { log(actor, action, target) }
