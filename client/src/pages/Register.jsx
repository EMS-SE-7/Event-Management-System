import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { homeFor, useAuth } from '../auth-context'
import AuthPoster from '../components/AuthPoster.jsx'

// Students only: the server ignores any role, Organizers are created by the seed script.
export default function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={homeFor(user.role)} replace />

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const created = await register(name, email, password)
      navigate(homeFor(created.role), { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <AuthPoster />
      <main className="auth-main">
        <div className="auth-card">
          <div style={{ display: 'grid', gap: 8 }}>
            <span className="eyebrow">New here</span>
            <h1>Student registration</h1>
            <p className="muted">Organizer accounts are set up by the admin team.</p>
          </div>
          <form onSubmit={onSubmit} className="auth-form">
            <div className="field">
              <label htmlFor="reg-name">Name</label>
              <input id="reg-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="reg-email">Email (@pesu.pes.edu)</label>
              <input id="reg-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
              <span className="field-hint">At least 6 characters.</span>
            </div>
            {error && <p role="alert" className="error">{error}</p>}
            <button type="submit" className="button button-signal button-block" disabled={busy}>
              {busy ? 'Creating account…' : 'Register'}
            </button>
          </form>
          <p className="auth-switch">
            Already registered? <Link to="/login">Login</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
