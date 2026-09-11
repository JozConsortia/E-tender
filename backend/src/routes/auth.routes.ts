import { Router } from 'express'
import { addAudit } from '../services/workflow.service.js'
import { authenticate, signToken } from '../middleware/auth.js'
import { users } from '../data/store.js'

const router = Router()

router.get('/me', authenticate, (req, res) => {
  const { password: _password, ...safeUser } = req.user!
  return res.json({ user: safeUser })
})

router.post('/login', (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')
  const user = users.find((item) => item.email.toLowerCase() === email && item.password === password)
  if (!user) return res.status(401).json({ message: 'Invalid email or password.' })
  addAudit(user.name, 'Signed in', user.email)
  const { password: _password, ...safeUser } = user
  return res.json({ token: signToken(user), user: safeUser })
})

router.post('/register', (req, res) => {
  const { name, email, password, organisation, director, documents } = req.body ?? {}
  if (!name || !email || !password || !organisation || !director || !Array.isArray(documents) || documents.length !== 3) return res.status(400).json({ message: 'Provide all supplier registration fields and three company documents.' })
  if (String(password).length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' })
  if (users.some((item) => item.email.toLowerCase() === String(email).trim().toLowerCase())) return res.status(409).json({ message: 'An account with this email already exists.' })
  const conflict = users.some((staff) => ['ADMIN', 'BEC', 'BAC', 'APPROVER', 'AUDITOR'].includes(staff.role) && staff.name.trim().toLowerCase() === String(director).trim().toLowerCase())
  if (conflict) return res.status(400).json({ message: 'The nominated company director matches a staff account. Staff members may not be directors of an applying company.' })
  const user = { id: `u-${Date.now()}`, name: String(name).trim(), email: String(email).trim().toLowerCase(), password: String(password), role: 'APPLICANT' as const, organisation: String(organisation).trim(), directors: [String(director).trim()], verificationStatus: 'PENDING' as const, verificationDocuments: documents.map(String) }
  users.push(user)
  addAudit(user.name, 'Submitted company verification', user.organisation)
  const { password: _password, ...safeUser } = user
  return res.status(201).json({ user: safeUser })
})

export default router
