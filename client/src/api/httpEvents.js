// Talks to the real Express server (through the Vite proxy: /api -> localhost:5000).
// Returns exactly the same shapes as api/mockEvents.js.

async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const body = await response.json().catch(() => null)

  if (!response.ok) {
    // The server always answers errors as { error: { code, message, details } }
    const error = new Error(body?.error?.message || 'Request failed')
    error.code = body?.error?.code
    error.details = body?.error?.details
    throw error
  }
  return body
}

export function listEvents({ page = 1, limit = 20 } = {}) {
  return request(`/events?page=${page}&limit=${limit}`)
}

export function getEvent(id) {
  return request(`/events/${encodeURIComponent(id)}`)
}

export function createEvent(input) {
  return request('/events', { method: 'POST', body: JSON.stringify(input) })
}
