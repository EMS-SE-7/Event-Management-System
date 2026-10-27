import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, clearToken, getToken, setToken, setUnauthorizedHandler } from './api'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken)
  const [user, setUser] = useState(null)
  // True while a stored token is being checked against /auth/me
  const [checking, setChecking] = useState(() => Boolean(getToken()))

  const logout = useCallback(() => {
    clearToken()
    setTokenState(null)
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
  }, [logout])

  useEffect(() => {
    if (!getToken()) return
    api('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => {}) // a 401 already logged out; other errors leave the user signed out of the UI
      .finally(() => setChecking(false))
  }, [])

  const authenticate = useCallback(async (path, body) => {
    const data = await api(path, { method: 'POST', body })
    setToken(data.token)
    setTokenState(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const value = useMemo(
    () => ({
      token,
      user,
      role: user?.role ?? null,
      checking,
      login: (email, password) => authenticate('/auth/login', { email, password }),
      register: (name, email, password) => authenticate('/auth/register', { name, email, password }),
      logout,
    }),
    [token, user, checking, authenticate, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
