import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { addAudit } from '../services/workflow.service.js'
import { authenticate, signToken } from '../middleware/auth.js'
import { prisma } from '../prisma.js'
import { toSafeUser } from '../lib/serialize.js'

const router = Router()

router.get('/me', authenticate, (req, res) => {
  return res.json({ user: toSafeUser(req.user!) })
})

router.post('/login', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Invalid email or password.' })
  await addAudit(user.name, 'Signed in', user.email)
  return res.json({ token: signToken(user), user: toSafeUser(user) })
})

router.post('/register', async (req, res) => {
  const { name, email, password, organisation, director, documents } = req.body ?? {}
  if (!name || !email || !password || !organisation || !director || !Array.isArray(documents) || documents.length !== 3) return res.status(400).json({ message: 'Provide all supplier registration fields and three company documents.' })
  if (String(password).length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' })

  const normalizedEmail = String(email).trim().toLowerCase()
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) return res.status(409).json({ message: 'An account with this email already exists.' })

  const staff = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'BEC', 'BAC', 'APPROVER', 'AUDITOR'] } } })
  const conflict = staff.some((member) => member.name.trim().toLowerCase() === String(director).trim().toLowerCase())
  if (conflict) return res.status(400).json({ message: 'The nominated company director matches a staff account. Staff members may not be directors of an applying company.' })

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
      verificationStatus: 'PENDING',
      verificationDocuments: JSON.stringify(documents.map(String)),
      updatedAt: new Date(),
    },
  })
  await addAudit(user.name, 'Submitted company verification', user.organisation ?? '')
  return res.status(201).json({ user: toSafeUser(user) })
})

export default router
