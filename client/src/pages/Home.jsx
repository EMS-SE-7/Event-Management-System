import { useAuth } from '../auth-context'

export function StudentDashboard() {
  const { user } = useAuth()
  return (
    <main>
      <h1>Student Dashboard</h1>
      <p>Welcome, {user.name}.</p>
    </main>
  )
}

export function OrganizerDashboard() {
  const { user } = useAuth()
  return (
    <main>
      <h1>Organizer Dashboard</h1>
      <p>Welcome, {user.name}.</p>
    </main>
  )
}

// Stand-in until the events and registration modules add their pages
export function Placeholder({ title }) {
  return (
    <main>
      <h1>{title}</h1>
      <p>Coming soon.</p>
    </main>
  )
}
