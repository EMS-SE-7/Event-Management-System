import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listMyEvents } from '../../api/events.js'
import StatusBadge from '../../components/StatusBadge.jsx'
import { formatDate, seatsText } from '../../utils/format.js'

// Events that can still be changed (EVENT-04): not cancelled and not finished.
const canEdit = (event) => event.status === 'Upcoming' || event.status === 'Ongoing'

// EVENT-04, EVENT-07: the logged-in organizer's own events, with links to manage each one.
export default function MyEventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    listMyEvents({ limit: 100 })
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
      <div className="page-head">
        <h1>My events</h1>
        <Link to="/organizer/events/new" className="button">Create event</Link>
      </div>

      {loading && <p className="muted">Loading your events...</p>}
      {error && <p className="error" role="alert">Could not load your events: {error}</p>}
      {!loading && !error && events.length === 0 && (
        <p className="muted">You have not created any events yet.</p>
      )}

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
              {event.category} &middot; {event.venue} &middot; {formatDate(event.startDateTime)}
            </p>
            <p>
              {event.registeredCount} registered &middot; {seatsText(event)}
            </p>
            <p className="card-actions">
              {canEdit(event) && <Link to={`/organizer/events/${event._id}/edit`}>Edit or cancel</Link>}
              <Link to={`/organizer/events/${event._id}/attendance`}>Attendance</Link>
              <Link to={`/organizer/events/${event._id}/report`}>Report</Link>
            </p>
          </li>
        ))}
      </ul>
    </main>
  )
}
