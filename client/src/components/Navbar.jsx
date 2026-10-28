import { Link, useNavigate } from 'react-router-dom'
import { ROLES, useAuth } from '../auth-context'

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
    ['/organizer/events/new', 'Create Event'],
  ],
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const onLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <strong>PESU-EMS</strong>
      {user ? (
        <>
          <ul>
            {(MENUS[user.role] || []).map(([to, label]) => (
              <li key={to}>
                <Link to={to}>{label}</Link>
              </li>
            ))}
          </ul>
          <span className="who">
            {user.name} ({user.role})
          </span>
          <button type="button" onClick={onLogout}>
            Logout
          </button>
        </>
      ) : (
        <ul>
          <li>
            <Link to="/login">Login</Link>
          </li>
          <li>
            <Link to="/register">Register</Link>
          </li>
        </ul>
      )}
    </nav>
  )
}
