import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import multer from 'multer'
import bcrypt from 'bcryptjs'
import { addAudit } from '../services/workflow.service.js'
import { raiseAlert } from '../services/alert.service.js'
import { authenticate, signToken } from '../middleware/auth.js'
import { prisma } from '../prisma.js'
import { toSafeUser } from '../lib/serialize.js'
import { analyseDocument } from '../gemini.js'

const router = Router()
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

const REGISTRATION_DOCUMENT_FIELDS = [
  { field: 'companyRegistrationDoc', label: 'Company Registration', keywords: ['company', 'registration', 'incorporation', 'certificate', 'cipc'] },
  { field: 'taxComplianceDoc', label: 'Tax Compliance Certificate', keywords: ['tax', 'compliance', 'sars', 'clearance'] },
  { field: 'bbeeCertificateDoc', label: 'B-BBEE Certificate', keywords: ['bbee', 'b bbee', 'empowerment', 'economic'] },
] as const

router.get('/me', authenticate, (req, res) => {
  return res.json({ user: toSafeUser(req.user!) })
})

router.post('/login', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')
  const user = await prisma.user.findUnique({ where: { email } })

  if (user?.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    return res.status(423).json({ message: `Too many failed sign-in attempts. Try again after ${user.lockedUntil.toLocaleTimeString('en-ZA')}.` })
  }

  if (!user || !(await bcrypt.compare(password, user.password))) {
    if (user) {
      const attempts = user.failedLoginAttempts + 1
      const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : null
      await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: attempts, lockedUntil } })
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        await raiseAlert({
          type: 'FAILED_LOGIN_LOCKOUT',
          severity: 'HIGH',
          message: `Account "${user.email}" was locked for ${LOCKOUT_MINUTES} minutes after ${attempts} consecutive failed sign-in attempts.`,
          targetType: 'user',
          targetId: user.id,
        })
      }
    }
    return res.status(401).json({ message: 'Invalid email or password.' })
  }

  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } })
  }
  await addAudit(user.name, 'Signed in', user.email)
  return res.json({ token: signToken(user), user: toSafeUser(user) })
})

router.post(
  '/register',
  upload.fields(REGISTRATION_DOCUMENT_FIELDS.map((d) => ({ name: d.field, maxCount: 1 }))),
  async (req, res) => {
    const { name, email, password, organisation, director } = req.body ?? {}
    const files = req.files as Record<string, Express.Multer.File[]> | undefined
    const missingFiles = REGISTRATION_DOCUMENT_FIELDS.filter((d) => !files?.[d.field]?.[0])

    if (!name || !email || !password || !organisation || !director || missingFiles.length) {
      return res.status(400).json({ message: 'Provide all supplier registration fields and three company documents.' })
    }
    if (String(password).length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' })

    const normalizedEmail = String(email).trim().toLowerCase()
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) return res.status(409).json({ message: 'An account with this email already exists.' })

    const staff = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'BEC', 'BAC', 'APPROVER', 'AUDITOR'] } } })
    const conflict = staff.some((member) => member.name.trim().toLowerCase() === String(director).trim().toLowerCase())
    if (conflict) {
      await raiseAlert({
        type: 'DIRECTOR_CONFLICT',
        severity: 'HIGH',
        message: `Registration attempt for "${String(organisation).trim()}" declared director "${String(director).trim()}", which matches an internal staff account.`,
        targetType: 'registration_attempt',
      })
      return res.status(400).json({ message: 'The nominated company director matches a staff account. Staff members may not be directors of an applying company.' })
    }

    const screenings = await Promise.all(REGISTRATION_DOCUMENT_FIELDS.map(async (doc) => {
      const file = files![doc.field][0]
      try {
        const analysis = await analyseDocument(file)
        const typeText = normalize(analysis.documentType || '')
        const matchesCategory = doc.keywords.some((keyword) => typeText.includes(keyword))
        const appearsAuthentic = analysis.appearsAuthentic !== false
        const isReadable = analysis.isDocumentReadable !== false
        return {
          label: doc.label,
          fileName: file.originalname,
          ok: matchesCategory && appearsAuthentic && isReadable,
          documentType: analysis.documentType || '',
          appearsAuthentic,
          isReadable,
          aiAvailable: true,
        }
      } catch {
        return { label: doc.label, fileName: file.originalname, ok: true, documentType: '', appearsAuthentic: true, isReadable: true, aiAvailable: false }
      }
    }))

    const failures = screenings.filter((s) => !s.ok)
    const verificationStatus = failures.length ? 'REJECTED' : 'PENDING'
    const verificationNote = failures.length
      ? `Automatically rejected by AI document screening: ${failures.map((f) => {
          if (!f.appearsAuthentic) return `${f.label} does not appear authentic`
          if (!f.isReadable) return `${f.label} could not be read`
          return `expected ${f.label} but the uploaded file "${f.fileName}" was identified as "${f.documentType || 'an unrecognised document'}"`
        }).join('; ')}.`
      : undefined

    const passwordHash = await bcrypt.hash(String(password), 10)
    const user = await prisma.user.create({
      data: {
        id: `u-${randomUUID()}`,
        name: String(name).trim(),
        email: normalizedEmail,
        password: passwordHash,
        role: 'APPLICANT',
        organisation: String(organisation).trim(),
        directors: JSON.stringify([String(director).trim()]),
        verificationStatus,
        verificationNote,
        verificationDocuments: JSON.stringify(REGISTRATION_DOCUMENT_FIELDS.map((d) => files![d.field][0].originalname)),
        updatedAt: new Date(),
      },
    })

    if (failures.length) {
      await raiseAlert({
        type: 'FAKE_DOCUMENT_REGISTRATION',
        severity: 'HIGH',
        message: `Registration for "${user.organisation}" was automatically rejected: ${verificationNote}`,
        targetType: 'user',
        targetId: user.id,
      })
      await addAudit(user.name, 'Registration automatically rejected by AI document screening', user.organisation ?? '')
    } else {
      await addAudit(user.name, 'Submitted company verification', user.organisation ?? '')
    }

    return res.status(201).json({ user: toSafeUser(user) })
  },
)

export default router
