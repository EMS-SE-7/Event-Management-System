// Talks to the real Express server through the shared helper in ../api.js, which sends the login token.
// Returns exactly the same shapes as api/mockEvents.js.
import { api } from '../api.js'

// Filters are optional: q (text search), category, status (Upcoming, Ongoing, Completed, Cancelled).
export function listEvents({ page = 1, limit = 20, q, category, status } = {}) {
  const params = new URLSearchParams({ page, limit })
  if (q) params.set('q', q)
  if (category) params.set('category', category)
  if (status) params.set('status', status)
  return api(`/events?${params}`)
}

export function getEvent(id) {
  return api(`/events/${encodeURIComponent(id)}`)
}

export function createEvent(input) {
  return api('/events', { method: 'POST', body: input })
}
