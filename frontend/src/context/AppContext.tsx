import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiFetch, TOKEN_KEY } from '../api'
import { demoApplications, demoAuditLogs, demoTenders, demoUsers } from '../data/demo'
import type { Application, AuditEntry, DemoUser, Role, Tender, TenderRequirement, EvaluationCriterion, VerificationStatus } from '../types'

type Result = { ok: boolean; message?: string; user?: DemoUser }
interface AppContextValue {
  currentUser: DemoUser | null
  users: DemoUser[]
  tenders: Tender[]
  applications: Application[]
  auditLogs: AuditEntry[]
  ready: boolean
  login: (email: string, password: string) => Promise<Result>
  registerApplicant: (input: { name: string; email: string; password: string; organisation: string; director: string; documents: string[] }) => Promise<Result>
  verifyApplicant: (userId: string, status: VerificationStatus, note?: string) => Promise<Result>
  logout: () => void
  createTender: (input: Pick<Tender, 'title' | 'department' | 'description' | 'closingDate'> & { requirements: TenderRequirement[]; criteria: EvaluationCriterion[] }) => Promise<Result>
  publishTender: (id: string) => Promise<Result>
  advanceTenderStage: (id: string) => Promise<Result>
  submitApplication: (tenderId: string, companyName: string, documents: string[]) => Promise<Result>
  evaluateApplication: (applicationId: string, score: number, note: string) => Promise<Result>
  decideApplication: (applicationId: string, status: Application['status'], note?: string) => Promise<Result>
  resetDemo: () => void
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

function bootstrapFallback() {
  return { users: demoUsers, tenders: demoTenders, applications: demoApplications, auditLogs: demoAuditLogs }
}

export function isTenderPastClosing(tender: Pick<Tender, 'closingDate'>) { return new Date(tender.closingDate).getTime() <= Date.now() }
export function isTenderOpenForApplications(tender: Tender) { return tender.status === 'PUBLISHED' && !isTenderPastClosing(tender) }

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<DemoUser[]>(demoUsers)
  const [tenders, setTenders] = useState<Tender[]>(demoTenders)
  const [applications, setApplications] = useState<Application[]>(demoApplications)
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(demoAuditLogs)
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null)
  const [ready, setReady] = useState(false)

  const refresh = async () => {
    const state = await apiFetch<{ users: DemoUser[]; tenders: Tender[]; applications: Application[]; auditLogs: AuditEntry[] }>('/bootstrap')
    setUsers(state.users); setTenders(state.tenders); setApplications(state.applications); setAuditLogs(state.auditLogs)
  }

  useEffect(() => {
    const session = localStorage.getItem(TOKEN_KEY)
    apiFetch<Tender[]>('/tenders')
      .then((publicTenders) => setTenders(publicTenders))
      .catch(() => {})
    if (!session) { setReady(true); return }
    apiFetch<{ user: DemoUser }>('/auth/me')
      .then(async (data) => {
        setCurrentUser(data.user)
        const state = await apiFetch<{ users: DemoUser[]; tenders: Tender[]; applications: Application[]; auditLogs: AuditEntry[] }>('/bootstrap')
        setUsers(state.users); setTenders(state.tenders); setApplications(state.applications); setAuditLogs(state.auditLogs)
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setReady(true))
  }, [])

  const refreshPublicTenders = async () => {
    try { setTenders(await apiFetch<Tender[]>('/tenders')) } catch {}
  }

  const login = async (email: string, password: string): Promise<Result> => {
    try {
      const data = await apiFetch<{ token: string; user: DemoUser }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
      localStorage.setItem(TOKEN_KEY, data.token); setCurrentUser(data.user); await refresh(); return { ok: true, user: data.user }
    } catch (error) { return { ok: false, message: error instanceof Error ? error.message : 'Login failed.' } }
  }

  const logout = () => { localStorage.removeItem(TOKEN_KEY); setCurrentUser(null) }

  const registerApplicant = async (input: Parameters<AppContextValue['registerApplicant']>[0]): Promise<Result> => {
    try { await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(input) }); await refreshPublicTenders(); return { ok: true } }
    catch (error) { return { ok: false, message: error instanceof Error ? error.message : 'Registration failed.' } }
  }

  const verifyApplicant = async (userId: string, status: VerificationStatus, note = ''): Promise<Result> => {
    try { await apiFetch(`/users/${userId}/verification`, { method: 'POST', body: JSON.stringify({ status, note }) }); await refresh(); return { ok: true } }
    catch (error) { return { ok: false, message: error instanceof Error ? error.message : 'Verification failed.' } }
  }

  const createTender = async (input: Parameters<AppContextValue['createTender']>[0]): Promise<Result> => {
    try { await apiFetch('/tenders', { method: 'POST', body: JSON.stringify(input) }); await refresh(); return { ok: true } }
    catch (error) { return { ok: false, message: error instanceof Error ? error.message : 'Tender could not be created.' } }
  }

  const publishTender = async (id: string): Promise<Result> => {
    try { await apiFetch(`/tenders/${id}/publish`, { method: 'POST' }); await refresh(); return { ok: true } }
    catch (error) { return { ok: false, message: error instanceof Error ? error.message : 'Tender could not be published.' } }
  }

  const advanceTenderStage = async (id: string): Promise<Result> => {
    try { await apiFetch(`/tenders/${id}/advance`, { method: 'POST' }); await refresh(); return { ok: true } }
    catch (error) { return { ok: false, message: error instanceof Error ? error.message : 'The tender stage could not be advanced.' } }
  }

  const submitApplication = async (tenderId: string, companyName: string, documents: string[]): Promise<Result> => {
    try { await apiFetch('/applications', { method: 'POST', body: JSON.stringify({ tenderId, companyName, documents }) }); await refresh(); return { ok: true } }
    catch (error) { return { ok: false, message: error instanceof Error ? error.message : 'Application could not be submitted.' } }
  }

  const evaluateApplication = async (applicationId: string, score: number, note: string): Promise<Result> => {
    try { await apiFetch(`/bec/evaluations/${applicationId}`, { method: 'POST', body: JSON.stringify({ score, note }) }); await refresh(); return { ok: true } }
    catch (error) { return { ok: false, message: error instanceof Error ? error.message : 'Evaluation could not be saved.' } }
  }

  const decideApplication = async (applicationId: string, status: Application['status'], note = ''): Promise<Result> => {
    try {
      if (currentUser?.role === 'BAC') {
        const decision = status === 'SHORTLISTED' ? 'APPROVE' : 'RETURN'
        await apiFetch(`/bac/cases/${applicationId}`, { method: 'POST', body: JSON.stringify({ decision, note }) })
      } else if (currentUser?.role === 'APPROVER') {
        const decision = status === 'SUCCESSFUL' ? 'APPROVE' : status === 'UNSUCCESSFUL' ? 'DECLINE' : 'RETURN'
        await apiFetch(`/approval/${applicationId}`, { method: 'POST', body: JSON.stringify({ decision, note }) })
      } else return { ok: false, message: 'You are not authorised to record this outcome.' }
      await refresh(); return { ok: true }
    } catch (error) { return { ok: false, message: error instanceof Error ? error.message : 'Decision could not be recorded.' } }
  }

  const resetDemo = () => window.location.reload()
  const value = useMemo<AppContextValue>(() => ({ currentUser, users, tenders, applications, auditLogs, ready, login, registerApplicant, verifyApplicant, logout, createTender, publishTender, advanceTenderStage, submitApplication, evaluateApplication, decideApplication, resetDemo }), [currentUser, users, tenders, applications, auditLogs, ready])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() { const context = useContext(AppContext); if (!context) throw new Error('useApp must be used within AppProvider'); return context }
export function roleLabel(role: Role) { return { ADMIN: 'Administrator', APPLICANT: 'Applicant / Bidder', BEC: 'Bid Evaluation Committee', BAC: 'Bid Adjudication Committee', APPROVER: 'Final Approver', AUDITOR: 'Auditor' }[role] }
