// Uses the shared helper in ../api.js, which sends the login token and reads the { error } format.
import { api } from '../api.js'

export function getMyReports() {
  return api('/reports/events')
}

export function getEventReport(eventId) {
  return api(`/reports/event/${encodeURIComponent(eventId)}`)
}
