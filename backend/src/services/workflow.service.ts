import { randomUUID } from 'node:crypto'
import { prisma } from '../prisma.js'

function formatTime(date: Date) {
  return date.toLocaleString('en-ZA', { hour12: false }).replace(',', '')
}

export async function addAudit(actor: string, action: string, target: string) {
  await prisma.auditLog.create({ data: { id: `log-${randomUUID()}`, time: formatTime(new Date()), actor, action, target } })
}

export async function syncTenderLifecycle() {
  const now = new Date()

  const closingPublishedTenders = await prisma.tender.findMany({ where: { status: 'PUBLISHED', closingDate: { lte: now } } })
  for (const tender of closingPublishedTenders) {
    await prisma.tender.update({ where: { id: tender.id }, data: { status: 'EVALUATION' } })
    await prisma.application.updateMany({ where: { tenderId: tender.id, status: 'SUBMITTED' }, data: { status: 'UNDER_EVALUATION' } })
    await addAudit('System', 'Moved tender to evaluation after closing', tender.reference)
  }

  const evaluationTenders = await prisma.tender.findMany({ where: { status: 'EVALUATION' }, include: { applications: { select: { status: true } } } })
  for (const tender of evaluationTenders) {
    if (tender.applications.length > 0 && tender.applications.every((application) => ['SHORTLISTED', 'SUCCESSFUL', 'UNSUCCESSFUL'].includes(application.status))) {
      await prisma.tender.update({ where: { id: tender.id }, data: { status: 'ADJUDICATION' } })
      await addAudit('System', 'Completed BEC evaluation stage', tender.reference)
    }
  }
}
