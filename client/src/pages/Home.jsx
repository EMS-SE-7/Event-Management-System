import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listEvents, listMyEvents } from '../api/events.js'
import { getMyReports } from '../api/reportApi.js'
import { getMyRegistrations } from '../api/registrations.js'
import { useAuth } from '../auth-context'
import StatusBadge from '../components/StatusBadge.jsx'
import { dateParts, greeting } from '../utils/format.js'

// Runs `load` once and keeps { data, error, loading }. A failed widget shows its own message
// and never blocks the rest of the dashboard.
function useLoad(load) {
  const [state, setState] = useState({ data: null, error: '', loading: true })
  useEffect(() => {
    let cancelled = false
    load()
      .then((data) => !cancelled && setState({ data, error: '', loading: false }))
      .catch((err) => !cancelled && setState({ data: null, error: err.message, loading: false }))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return state
}

const isLive = (event) => event && (event.status === 'Upcoming' || event.status === 'Ongoing')
const byStart = (a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)
const firstName = (name = '') => name.split(/[\s._]/)[0]

function Stat({ label, value, note, tone }) {
  return (
    <div className={`stat${tone ? ` stat-${tone}` : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value ?? '–'}</span>
      {note && <span className="stat-note">{note}</span>}
    </div>
  )
}

function Agenda({ items, empty }) {
  if (items.length === 0) return <div className="empty">{empty}</div>
  return (
    <ul className="agenda">
      {items.map(({ key, event, right }) => {
        const { day, month, time } = dateParts(event.startDateTime)
        return (
          <li key={key}>
            <div className="agenda-date">
              <span>{month}</span>
              <b>{day}</b>
            </div>
            <div>
              <Link className="agenda-title" to={`/events/${event._id}`}>{event.title}</Link>
              <div className="agenda-sub">
                {time} · {event.venue}
              </div>
            </div>
            {right}
          </li>
        )
      })}
    </ul>
  )
}

function Hello({ title, name, children }) {
  return (
    <header className="page-head">
      <div className="page-head-text">
        <h1 className="eyebrow">{title}</h1>
        <p className="greeting">
          {greeting()}, <em>{firstName(name)}</em>.
        </p>
        <p className="muted">{children}</p>
      </div>
    </header>
  )
}

export function StudentDashboard() {
  const { user } = useAuth()
  const mine = useLoad(() => getMyRegistrations('Registered'))
  const open = useLoad(() => listEvents({ status: 'Upcoming', limit: 6 }))

  const active = (mine.data?.data || []).filter((r) => isLive(r.event)).sort((a, b) => byStart(a.event, b.event))
  const openEvents = (open.data?.data || []).filter((e) => e.registrationOpen)

  return (
    <main className="page">
      <Hello title="Student Dashboard" name={user.name}>
        Here is what you are signed up for, and what is still open.
      </Hello>

      <div className="stats">
        <Stat label="Coming up for you" value={mine.loading ? '…' : active.length} note="active registrations" />
        <Stat label="Upcoming on campus" value={open.loading ? '…' : open.data?.meta?.total} note="events not started yet" />
        <Stat label="Open right now" value={open.loading ? '…' : openEvents.length} note="in the next few events" />
      </div>

      <div className="two-col section">
        <section>
          <div className="section-head">
            <h2>Your next events</h2>
            <Link to="/student/registrations">All registrations →</Link>
          </div>
          {mine.loading && <p className="loading">Loading</p>}
          {mine.error && <p className="error" role="alert">{mine.error}</p>}
          {!mine.loading && !mine.error && (
            <Agenda
              items={active.slice(0, 5).map((r) => ({ key: r._id, event: r.event, right: <StatusBadge status={r.event.status} /> }))}
              empty={
                <>
                  <span>You have not registered for anything coming up.</span>
                  <Link to="/events" className="button button-small">Browse events</Link>
                </>
              }
            />
          )}
        </section>

        <section>
          <div className="section-head">
            <h2>Open for registration</h2>
            <Link to="/events?status=Upcoming">See all →</Link>
          </div>
          {open.loading && <p className="loading">Loading</p>}
          {open.error && <p className="error" role="alert">{open.error}</p>}
          {!open.loading && !open.error && (
            <Agenda
              items={openEvents.slice(0, 5).map((e) => ({
                key: e._id,
                event: e,
                right: <span className="mono muted">{e.seatsLeft} left</span>,
              }))}
              empty="Nothing is open for registration right now."
            />
          )}
        </section>
      </div>
    </main>
  )
}

export function OrganizerDashboard() {
  const { user } = useAuth()
  const reports = useLoad(() => getMyReports())
  const mine = useLoad(() => listMyEvents({ limit: 100 }))

  const events = mine.data?.data || []
  const live = events.filter(isLive).sort(byStart)
  const totals = reports.data?.totals

  return (
    <main className="page">
      <Hello title="Organizer Dashboard" name={user.name}>
        Your events at a glance: who is coming, and who showed up.
      </Hello>

      <div className="stats">
        <Stat label="Your events" value={mine.loading ? '…' : mine.data?.meta?.total ?? events.length} note={`${live.length} upcoming or live`} />
        <Stat label="Registrations" value={reports.loading ? '…' : totals?.registrations} note="active, across all events" />
        <Stat label="Present" value={reports.loading ? '…' : totals?.present} tone="present" note="attendance marked" />
        <Stat label="Absent" value={reports.loading ? '…' : totals?.absent} tone="absent" note="attendance marked" />
      </div>

      <div className="two-col section">
        <section>
          <div className="section-head">
            <h2>Coming up</h2>
            <Link to="/organizer/events">All my events →</Link>
          </div>
          {mine.loading && <p className="loading">Loading</p>}
          {mine.error && <p className="error" role="alert">{mine.error}</p>}
          {!mine.loading && !mine.error && (
            <Agenda
              items={live.slice(0, 5).map((e) => ({
                key: e._id,
                event: e,
                right: <span className="mono muted">{e.registeredCount}/{e.capacity}</span>,
              }))}
              empty={
                <>
                  <span>No upcoming events yet.</span>
                  <Link to="/organizer/events/new" className="button button-small button-signal">Create one</Link>
                </>
              }
            />
          )}
        </section>

        <section>
          <div className="section-head">
            <h2>Shortcuts</h2>
          </div>
          <div className="quick-links" style={{ gridTemplateColumns: '1fr' }}>
            <Link to="/organizer/events/new" className="quick-link">
              <strong>New event</strong>
              <span>Set the venue, dates and number of seats.</span>
            </Link>
            <Link to="/organizer/attendance" className="quick-link">
              <strong>Take attendance</strong>
              <span>Mark students present or absent.</span>
            </Link>
            <Link to="/organizer/reports" className="quick-link">
              <strong>Reports</strong>
              <span>Registration and attendance numbers per event.</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
