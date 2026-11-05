import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ROLES, homeFor, useAuth } from '../auth-context'
import { initials } from '../utils/format.js'

const MENUS = {
  [ROLES.STUDENT]: [
    ['/student', 'Dashboard'],
    ['/events', 'Browse Events'],
    ['/student/registrations', 'My Registrations'],
  ],
  [ROLES.ORGANIZER]: [
    ['/organizer', 'Dashboard'],
    ['/events', 'Browse Events'],
    ['/organizer/events', 'My Events'],
    ['/organizer/attendance', 'Take Attendance'],
    ['/organizer/reports', 'Reports'],
    ['/organizer/events/new', 'Create Event'],
  ],
}

function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
      <path fill="#f6f3ee" d="M4 7h24a2 2 0 0 1 2 2v4a3 3 0 0 0 0 6v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a3 3 0 0 0 0-6V9a2 2 0 0 1 2-2z" />
      <path stroke="#e8492a" strokeWidth="2" strokeDasharray="2 2" d="M21 9v14" />
      <rect x="7" y="12" width="9" height="2.4" rx="1" fill="#1b2a41" />
      <rect x="7" y="17" width="6" height="2.4" rx="1" fill="#1b2a41" opacity=".5" />
    </svg>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const onLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to={user ? homeFor(user.role) : '/login'} className="brand">
          <BrandMark />
          <span>
            PESU Events <small>EMS</small>
          </span>
        </Link>
        {user ? (
          <>
            <nav aria-label="Main">
              <ul className="nav">
                {(MENUS[user.role] || []).map(([to, label]) => (
                  <li key={to}>
                    <NavLink to={to} end>
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="who">
              <div className="who-name">
                <span>{user.name}</span>
                <span>{user.role}</span>
              </div>
              <span className="avatar" aria-hidden="true">{initials(user.name)}</span>
              <button type="button" className="button button-ghost button-small" onClick={onLogout}>
                Logout
              </button>
            </div>
          </>
        ) : (
          <nav aria-label="Main" className="who">
            <ul className="nav">
              <li>
                <NavLink to="/login">Login</NavLink>
              </li>
              <li>
                <NavLink to="/register">Register</NavLink>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  )
}
