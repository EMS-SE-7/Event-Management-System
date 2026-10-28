// Shared fetch helper: attaches the JWT and reports 401s so the app can log out.
export const TOKEN_KEY = 'token'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

let onUnauthorized = () => {}
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn
}

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

export class ApiError extends Error {
  constructor(status, message, { code, details } = {}) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken()
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Try again.')
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    // Only a request that carried a token means the session died; a failed login has none.
    if (res.status === 401 && token) onUnauthorized()
    throw new ApiError(res.status, data.error?.message || 'Something went wrong', data.error)
  }
  return data
}
