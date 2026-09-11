import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import type { Role } from '../types'

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { currentUser, ready } = useApp()
  const location = useLocation()

  if (!ready) return null
  if (!currentUser) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (roles && !roles.includes(currentUser.role)) return <Navigate to="/forbidden" replace />
  return <Outlet />
}
