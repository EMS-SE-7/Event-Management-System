// Uses the shared helper in ../api.js, which sends the login token and reads the { error } format.
// Demo mode (VITE_USE_MOCK=true) uses the sample data in mockReports.js instead.
import { api } from '../api.js'
import * as mock from './mockReports.js'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export function getMyEvents() {
  if (useMock) return mock.getMyEvents()
  return api('/attendance/events')
}

export function getEventAttendance(eventId) {
  if (useMock) return mock.getEventAttendance(eventId)
  return api(`/attendance/event/${encodeURIComponent(eventId)}`)
}

export function markAttendance(registrationId, status) {
  if (useMock) return mock.markAttendance(registrationId, status)
  return api(`/attendance/${encodeURIComponent(registrationId)}`, { method: 'PATCH', body: { status } })
}
