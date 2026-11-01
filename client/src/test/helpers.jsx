import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import App from '../App'
import { AuthProvider } from '../AuthContext'

export const student = { id: 'stu1', name: 'Stu Dent', email: 'stu@pesu.pes.edu', role: 'Student' }
export const organizer = { id: 'org1', name: 'Org Anizer', email: 'org@pesu.pes.edu', role: 'Organizer' }

export const reply = (status, body) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) })

// An event as the API returns it, owned by `organizer`, starting in a week.
export function apiEvent(overrides = {}) {
  const start = Date.now() + 7 * 24 * 60 * 60 * 1000
  return {
    _id: 'ev1',
    title: 'Hackathon 2026',
    description: 'A 24 hour coding event',
    category: 'Technical',
    venue: 'MRD Auditorium',
    startDateTime: new Date(start).toISOString(),
    endDateTime: new Date(start + 3 * 60 * 60 * 1000).toISOString(),
    registrationDeadline: new Date(start - 24 * 60 * 60 * 1000).toISOString(),
    capacity: 100,
    registeredCount: 10,
    seatsLeft: 90,
    isFull: false,
    registrationOpen: true,
    status: 'Upcoming',
    organizer: organizer.id,
    ...overrides,
  }
}

// Fake server: handlers keyed by "METHOD /path" (query string ignored).
// Each handler gets { url, body } and returns reply(...). Returns the fetch mock so tests can read calls.
export function mockServer(routes) {
  const fetchMock = vi.fn((url, { method = 'GET', body } = {}) => {
    const path = url.replace('/api', '').split('?')[0]
    const handler = routes[`${method} ${path}`]
    const parsed = body ? JSON.parse(body) : undefined
    return handler ? handler({ url, body: parsed }) : reply(404, { error: { code: 'NOT_FOUND', message: 'Not found' } })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

// Renders the whole app at `path`, logged in as `user` (or logged out when user is null).
export function renderAs(user, path, routes = {}) {
  if (user) localStorage.setItem('token', `jwt-${user.id}`)
  const fetchMock = mockServer({
    ...(user && { 'GET /auth/me': () => reply(200, { user }) }),
    ...routes,
  })
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
  return fetchMock
}

// The calls made to one "METHOD /path", with their parsed JSON bodies.
export function callsTo(fetchMock, method, path) {
  return fetchMock.mock.calls
    .filter(([url, options = {}]) => (options.method || 'GET') === method && url.replace('/api', '').split('?')[0] === path)
    .map(([url, options = {}]) => ({ url, body: options.body ? JSON.parse(options.body) : undefined }))
}
