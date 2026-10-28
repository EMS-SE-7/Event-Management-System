// Talks to the real Express server through the shared helper in ../api.js, which sends the login token.
// Returns exactly the same shapes as api/mockEvents.js.
import { api } from '../api.js'

export function listEvents({ page = 1, limit = 20 } = {}) {
  return api(`/events?page=${page}&limit=${limit}`)
}

export function getEvent(id) {
  return api(`/events/${encodeURIComponent(id)}`)
}

export function createEvent(input) {
  return api('/events', { method: 'POST', body: input })
}
