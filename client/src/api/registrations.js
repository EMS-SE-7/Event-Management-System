// Registration API used by the Register button.
//
// Demo mode (default): registrations are simulated in memory, no server needed.
// Real mode: client/.env.local contains   VITE_USE_MOCK=false   (same switch as api/events.js).

import { api } from '../api.js'

const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

function makeError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

// ---- Demo mode ----
const demoRegistered = new Set()

async function mockRegister(eventId) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  if (demoRegistered.has(eventId)) {
    throw makeError('ALREADY_REGISTERED', 'You are already registered for this event')
  }
  demoRegistered.add(eventId)
  return { data: { event: eventId, status: 'Registered', attendanceStatus: 'Not Marked' } }
}

// ---- Real mode ----
// The shared helper in ../api.js sends the saved login token and throws an error carrying error.code.
function httpRegister(eventId) {
  return api('/registrations', { method: 'POST', body: { eventId } })
}

export const registerForEvent = useMock ? mockRegister : httpRegister