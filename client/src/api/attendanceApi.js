// Uses the shared helper in ../api.js, which sends the login token and reads the { error } format.
import { api } from '../api.js'

export function getMyEvents() {
  return api('/attendance/events')
}

export function getEventAttendance(eventId) {
  return api(`/attendance/event/${encodeURIComponent(eventId)}`)
}

export function markAttendance(registrationId, status) {
  return api(`/attendance/${encodeURIComponent(registrationId)}`, { method: 'PATCH', body: { status } })
}
