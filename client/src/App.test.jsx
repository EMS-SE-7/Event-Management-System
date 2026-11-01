import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import App from './App'
import { AuthProvider } from './AuthContext'

const student = { id: '1', name: 'Stu Dent', email: 'stu@pesu.pes.edu', role: 'Student' }
const organizer = { id: '2', name: 'Org Anizer', email: 'org@pesu.pes.edu', role: 'Organizer' }

const reply = (status, body) => Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) })

// Fake server: routes keyed by "METHOD /path"
const mockServer = (routes) => {
  const fetchMock = vi.fn((url, { method = 'GET' } = {}) => {
    const handler = routes[`${method} ${url.replace('/api', '')}`]
    return handler ? handler() : reply(404, { error: { message: 'Not found' } })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )

const fillLogin = async (email, password) => {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: 'Login' }))
}

beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}))
afterEach(() => vi.unstubAllGlobals())

describe('login', () => {
  test('student login stores the token and lands on the student dashboard', async () => {
    mockServer({ 'POST /auth/login': () => reply(200, { token: 'jwt-s', user: student }) })
    renderAt('/login')

    await fillLogin(student.email, 'secret123')

    expect(await screen.findByRole('heading', { name: 'Student Dashboard' })).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBe('jwt-s')
    expect(screen.getByRole('link', { name: 'My Registrations' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Create Event' })).not.toBeInTheDocument()
  })

  test('organizer login lands on the organizer dashboard with the organizer menu', async () => {
    mockServer({ 'POST /auth/login': () => reply(200, { token: 'jwt-o', user: organizer }) })
    renderAt('/login')

    await fillLogin(organizer.email, 'secret123')

    expect(await screen.findByRole('heading', { name: 'Organizer Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create Event' })).toBeInTheDocument()
  })

  test('invalid credentials show the server message and stay on the login page', async () => {
    mockServer({
      'POST /auth/login': () => reply(401, { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } }),
    })
    renderAt('/login')

    await fillLogin(student.email, 'wrong-pass')

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials')
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeNull()
  })
})

describe('route guards', () => {
  test('logged-out visitor is sent to /login', async () => {
    mockServer({})
    renderAt('/organizer')

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument()
  })

  test('student on an organizer route is redirected to the student dashboard', async () => {
    localStorage.setItem('token', 'jwt-s')
    mockServer({ 'GET /auth/me': () => reply(200, { user: student }) })
    renderAt('/organizer/events/new')

    expect(await screen.findByRole('heading', { name: 'Student Dashboard' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Create event' })).not.toBeInTheDocument()
  })

  test('organizer reaches an organizer route', async () => {
    localStorage.setItem('token', 'jwt-o')
    mockServer({ 'GET /auth/me': () => reply(200, { user: organizer }) })
    renderAt('/organizer/events/new')

    expect(await screen.findByRole('heading', { name: 'Create event' })).toBeInTheDocument()
  })
})

describe('session', () => {
  test('requests carry the bearer token', async () => {
    localStorage.setItem('token', 'jwt-s')
    const fetchMock = mockServer({ 'GET /auth/me': () => reply(200, { user: student }) })
    renderAt('/student')

    await screen.findByRole('heading', { name: 'Student Dashboard' })
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer jwt-s')
  })

  test('a 401 from the API logs the user out', async () => {
    localStorage.setItem('token', 'expired')
    mockServer({ 'GET /auth/me': () => reply(401, { error: { message: 'Session expired' } }) })
    renderAt('/student')

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeNull()
  })

  test('logout clears the token and returns to login', async () => {
    localStorage.setItem('token', 'jwt-s')
    mockServer({ 'GET /auth/me': () => reply(200, { user: student }) })
    renderAt('/student')

    await userEvent.click(await screen.findByRole('button', { name: 'Logout' }))

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeNull()
  })
})
