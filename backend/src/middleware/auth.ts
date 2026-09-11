import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import type { User } from '@prisma/client'
import type { Role } from '../types/models.js'
import { prisma } from '../prisma.js'

const secret = process.env.JWT_SECRET || 'demo-etender-secret'

declare global {
  namespace Express { interface Request { user?: User } }
}

export function signToken(user: Pick<User, 'id' | 'role'>) {
  return jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: '8h' })
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization')
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'Authentication required.' })
  try {
    const payload = jwt.verify(header.slice(7), secret) as jwt.JwtPayload
    const user = await prisma.user.findUnique({ where: { id: String(payload.sub) } })
    if (!user) return res.status(401).json({ message: 'Invalid session.' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session.' })
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required.' })
    if (!roles.includes(req.user.role as Role)) return res.status(403).json({ message: 'You are not authorised for this action.' })
    next()
  }
}
