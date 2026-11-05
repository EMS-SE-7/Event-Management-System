import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listMyEvents } from '../../api/events.js'
import EventCard from '../../components/EventCard.jsx'
import PageHead from '../../components/PageHead.jsx'
import SeatsMeter from '../../components/SeatsMeter.jsx'

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
      <PageHead eyebrow="Organizer" title="My events" intro="Everything you have created. Open an event to edit it, take attendance or see who signed up.">
        <Link to="/organizer/events/new" className="button button-signal">Create event</Link>
      </PageHead>

      {loading && <p className="loading">Loading your events</p>}
      {error && <p className="error" role="alert">Could not load your events: {error}</p>}
      {!loading && !error && events.length === 0 && (
        <div className="empty">
          <span>You have not created any events yet.</span>
        </div>
      )}

      <ul className="event-list event-list-single">
        {events.map((event) => (
          <EventCard
            key={event._id}
            event={event}
            foot={
              <SeatsMeter event={event}>
                <span>{event.registeredCount} registered</span>
              </SeatsMeter>
            }
            actions={
              <>
                {canEdit(event) && <Link to={`/organizer/events/${event._id}/edit`} className="button button-small">Edit or cancel</Link>}
                <Link to={`/organizer/events/${event._id}/attendance`} className="button button-ghost button-small">Attendance</Link>
                <Link to={`/organizer/events/${event._id}/participants`} className="button button-ghost button-small">Participants</Link>
                <Link to={`/organizer/events/${event._id}/report`} className="button button-ghost button-small">Report</Link>
              </>
            }
          />
        ))}
      </ul>
    </main>
  )
}
