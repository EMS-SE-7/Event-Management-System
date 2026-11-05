// Uses the shared helper in ../api.js, which sends the login token and reads the { error } format.
// Demo mode (VITE_USE_MOCK=true) uses the sample data in mockReports.js instead.
import { api } from '../api.js'
import * as mock from './mockReports.js'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export function getMyReports() {
  if (useMock) return mock.getMyReports()
  return api('/reports/events')
}

export function getEventReport(eventId) {
  if (useMock) return mock.getEventReport(eventId)
  return api(`/reports/event/${encodeURIComponent(eventId)}`)
}
