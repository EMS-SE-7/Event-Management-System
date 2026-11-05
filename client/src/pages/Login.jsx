import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { homeFor, useAuth } from '../auth-context'
import AuthPoster from '../components/AuthPoster.jsx'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
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
      const loggedIn = await login(email, password)
      navigate(homeFor(loggedIn.role), { replace: true })
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
            <span className="eyebrow">Welcome back</span>
            <h1>Login</h1>
            <p className="muted">Use your @pesu.pes.edu email.</p>
          </div>
          <form onSubmit={onSubmit} className="auth-form">
            <div className="field">
              <label htmlFor="login-email">Email</label>
              <input id="login-email" type="email" autoComplete="email" placeholder="pes1ug24cs001@pesu.pes.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="login-password">Password</label>
              <input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p role="alert" className="error">{error}</p>}
            <button type="submit" className="button button-signal button-block" disabled={busy}>
              {busy ? 'Logging in…' : 'Login'}
            </button>
          </form>
          <p className="auth-switch">
            New student? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
