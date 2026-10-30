// Registration API used by the Register button.
//
// Demo mode (default): registrations are simulated in memory, no server needed.
// Real mode: client/.env.local contains   VITE_USE_MOCK=false   (same switch as api/events.js).

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
// Until the login module is merged, the server uses a stub login: these headers make the
// request come from a student. Once real login exists, the saved token is sent instead.
const DEMO_STUDENT_ID = '000000000000000000000100'

function authHeaders() {
  const token = localStorage.getItem('token')
  if (token) return { Authorization: `Bearer ${token}` }
  return { 'x-stub-role': 'student', 'x-stub-user-id': DEMO_STUDENT_ID }
}

async function httpRegister(eventId) {
  const response = await fetch('/api/registrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ eventId }),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    // The server answers errors as { error: { code, message } }
    throw makeError(body?.error?.code, body?.error?.message || 'Request failed')
  }
  return body
}

export const registerForEvent = useMock ? mockRegister : httpRegister