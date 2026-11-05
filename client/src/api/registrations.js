// Registration API used by the Register button and the student/organizer pages.
//
// Real mode (default): calls the server with the login token.
// Demo mode: client/.env.local contains   VITE_USE_MOCK=true   (same switch as api/events.js).

import { api } from '../api.js'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

function makeError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

// ---- Demo mode ----
const demoRegistered = new Set()
let demoList = [
  {
    _id: 'demo-1',
    status: 'Registered',
    isActive: true,
    attendanceStatus: 'Not Marked',
    event: { _id: 'e1', title: 'Hackathon 2026', category: 'Technical', venue: 'Main Hall', startDateTime: '2026-12-10T09:00:00Z' },
  },
  {
    _id: 'demo-2',
    status: 'Cancelled',
    isActive: false,
    attendanceStatus: 'Not Marked',
    event: { _id: 'e2', title: 'Dance Night', category: 'Cultural', venue: 'Auditorium', startDateTime: '2026-11-20T18:00:00Z' },
  },
]
const demoParticipants = [
  { _id: 'p1', status: 'Registered', attendanceStatus: 'Present', student: { name: 'Asha Rao', email: 'asha@pes.edu' } },
  { _id: 'p2', status: 'Registered', attendanceStatus: 'Not Marked', student: { name: 'Vikram S', email: 'vikram@pes.edu' } },
]
const wait = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

async function mockRegister(eventId) {
  await wait()
  if (demoRegistered.has(eventId)) {
    throw makeError('ALREADY_REGISTERED', 'You are already registered for this event')
  }
  demoRegistered.add(eventId)
  return { data: { event: eventId, status: 'Registered', attendanceStatus: 'Not Marked' } }
}

async function mockMine(status) {
  await wait()
  return { data: status ? demoList.filter((r) => r.status === status) : demoList }
}

async function mockCancel(id) {
  await wait()
  const reg = demoList.find((r) => r._id === id)
  if (!reg) throw makeError('NOT_FOUND', 'Registration not found')
  if (reg.status === 'Cancelled') throw makeError('ALREADY_CANCELLED', 'This registration is already cancelled')
  reg.status = 'Cancelled'
  reg.isActive = false
  return { data: reg }
}

async function mockParticipants() {
  await wait()
  return { data: demoParticipants }
}

// ---- Real mode ----
// The shared helper in ../api.js sends the saved login token and throws an error carrying error.code.
function httpRegister(eventId) {
  return api('/registrations', { method: 'POST', body: { eventId } })
}

// HIST-01 to HIST-04: the logged-in student's registrations (optional status filter).
function httpMine(status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return api(`/registrations/mine${query}`)
}

// REG-07, REG-08
function httpCancel(id) {
  return api(`/registrations/${id}/cancel`, { method: 'PATCH' })
}

// PART-01, PART-02: organizer only, for one of their own events.
function httpParticipants(eventId) {
  return api(`/events/${eventId}/participants`)
}

export const registerForEvent = useMock ? mockRegister : httpRegister
export const getMyRegistrations = useMock ? mockMine : httpMine
export const cancelRegistration = useMock ? mockCancel : httpCancel
export const getEventParticipants = useMock ? mockParticipants : httpParticipants