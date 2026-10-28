import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEvent } from '../../api/events.js'
import StatusBadge from '../../components/StatusBadge.jsx'
import { formatDate, seatsText } from '../../utils/format.js'

function EventDetails({ id }) {
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    getEvent(id)
      .then((result) => {
        if (!cancelled) setEvent(result.data)
      })
      .catch((err) => {
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <p className="muted">Loading event...</p>

  if (error) {
    return (
      <p className="error" role="alert">
        {error.code === 'NOT_FOUND' ? 'This event does not exist.' : `Could not load the event: ${error.message}`}
      </p>
    )
  }

  return (
    <article className="event-details">
      <div className="event-card-head">
        <h1>{event.title}</h1>
        <StatusBadge status={event.status} />
      </div>
      <p className="muted">{event.category}</p>

      {event.description && <p className="description">{event.description}</p>}

      <dl className="facts">
        <dt>Venue</dt>
        <dd>{event.venue}</dd>
        <dt>Starts</dt>
        <dd>{formatDate(event.startDateTime)}</dd>
        <dt>Ends</dt>
        <dd>{formatDate(event.endDateTime)}</dd>
        <dt>Register by</dt>
        <dd>{formatDate(event.registrationDeadline)}</dd>
        <dt>Seats</dt>
        <dd>{seatsText(event)}</dd>
      </dl>

      <p className={event.registrationOpen ? 'open' : 'closed'}>
        {event.registrationOpen ? 'Registration is open' : 'Registration is closed'}
      </p>

      {/* The Register button from the registration module goes here. */}
      <div className="register-slot" />
    </article>
  )
}

// DISC-04, DISC-05, DISC-06: one event with its status, seats left and registration availability
export default function EventDetailsPage() {
  const { id } = useParams()
  return (
    <main className="page">
      <p>
        <Link to="/events">&larr; Back to events</Link>
      </p>
      {/* key={id} starts a fresh page whenever the event changes */}
      <EventDetails key={id} id={id} />
    </main>
  )
}
