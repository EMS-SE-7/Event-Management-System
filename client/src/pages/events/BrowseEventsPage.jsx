import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listEvents } from '../../api/events.js'
import StatusBadge from '../../components/StatusBadge.jsx'

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function seatsText(event) {
  if (event.isFull) return 'Full'
  return `${event.seatsLeft} of ${event.capacity} seats left`
}

// DISC-01, DISC-05, DISC-06: browse events with status, seats and registration availability
export default function BrowseEventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    listEvents()
      .then((result) => {
        if (!cancelled) setEvents(result.data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="page">
      <h1>Browse events</h1>

      {loading && <p className="muted">Loading events...</p>}
      {error && <p className="error" role="alert">Could not load events: {error}</p>}
      {!loading && !error && events.length === 0 && <p className="muted">There are no events yet.</p>}

      <ul className="event-list">
        {events.map((event) => (
          <li key={event._id} className="event-card">
            <div className="event-card-head">
              <h2>
                <Link to={`/events/${event._id}`}>{event.title}</Link>
              </h2>
              <StatusBadge status={event.status} />
            </div>
            <p className="muted">
              {event.category} &middot; {event.venue}
            </p>
            <p>{formatDate(event.startDateTime)}</p>
            <p className="event-card-foot">
              <span>{seatsText(event)}</span>
              <span className={event.registrationOpen ? 'open' : 'closed'}>
                {event.registrationOpen ? 'Registration open' : 'Registration closed'}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </main>
  )
}
