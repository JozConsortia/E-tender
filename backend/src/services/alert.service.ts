import nodemailer from 'nodemailer'
import { prisma } from '../prisma.js'

type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH'

let transporter: ReturnType<typeof nodemailer.createTransport> | null | undefined
let warnedMissingConfig = false

function getTransporter() {
  if (transporter !== undefined) return transporter
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    transporter = null
    return transporter
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
  return transporter
}

async function sendAlertEmail(subject: string, body: string) {
  const to = process.env.ALERT_EMAIL_TO
  const from = process.env.ALERT_EMAIL_FROM || process.env.SMTP_USER
  const mailer = getTransporter()
  if (!mailer || !to) {
    if (!warnedMissingConfig) {
      console.warn('[alerts] Email delivery is not configured (set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ALERT_EMAIL_TO in backend/.env). Alerts are still recorded in-app.')
      warnedMissingConfig = true
    }
    return
  }
  try {
    await mailer.sendMail({ from, to, subject: `[e-Tender alert] ${subject}`, text: body })
  } catch (error) {
    console.error('[alerts] Failed to send alert email:', error)
  }
}

export async function raiseAlert(input: {
  type: string
  message: string
  severity?: AlertSeverity
  targetType?: string
  targetId?: string
}) {
  const alert = await prisma.securityAlert.create({
    data: {
      type: input.type,
      message: input.message,
      severity: input.severity ?? 'MEDIUM',
      targetType: input.targetType,
      targetId: input.targetId,
    },
  })
  await sendAlertEmail(`${input.severity ?? 'MEDIUM'} — ${input.type.replace(/_/g, ' ')}`, input.message)
  return alert
}
