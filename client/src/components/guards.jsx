import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROLES, homeFor, useAuth } from '../auth-context'

// Layout route: renders children only for a logged-in user, optionally limited to `role`.
function Guard({ role }) {
  const { user, checking } = useAuth()
  const location = useLocation()

  if (checking) return <p className="status">Loading…</p>
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (role && user.role !== role) return <Navigate to={homeFor(user.role)} replace />
  return <Outlet />
}

export const ProtectedRoute = () => <Guard />
export const OrganizerRoute = () => <Guard role={ROLES.ORGANIZER} />
