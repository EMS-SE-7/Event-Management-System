import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEvent } from '../../api/events.js'
import { getMyRegistrations } from '../../api/registrations.js'
import { ROLES, useAuth } from '../../auth-context'
import CategoryTag from '../../components/CategoryTag.jsx'
import DateStub from '../../components/DateStub.jsx'
import Icon from '../../components/Icon.jsx'
import RegisterButton from '../../components/RegisterButton.jsx'
import SeatsMeter from '../../components/SeatsMeter.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { formatDate } from '../../utils/format.js'

// For a student: is there an active registration for this event? null while still checking.
function useRegisteredFor(eventId, enabled) {
  const [registered, setRegistered] = useState(enabled ? null : false)
  useEffect(() => {
    if (!enabled) return undefined
    let cancelled = false
    getMyRegistrations('Registered')
      .then((result) => {
        const list = Array.isArray(result.data) ? result.data : []
        const found = list.some((r) => String(r.event?._id ?? r.event) === String(eventId) && r.status === 'Registered')
        if (!cancelled) setRegistered(found)
      })
      .catch(() => !cancelled && setRegistered(false)) // the server still blocks a double registration
    return () => {
      cancelled = true
    }
  }, [eventId, enabled])
  return registered
}

function EventDetails({ id }) {
  const { user } = useAuth()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isStudent = user?.role !== ROLES.ORGANIZER
  const registered = useRegisteredFor(id, isStudent)

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

  // After a successful registration, show one seat fewer without reloading.
  function handleRegistered() {
    setEvent((current) => {
      const seatsLeft = Math.max((current.seatsLeft ?? 1) - 1, 0)
      return {
        ...current,
        registeredCount: (current.registeredCount ?? 0) + 1,
        seatsLeft,
        isFull: seatsLeft === 0,
        registrationOpen: current.registrationOpen && seatsLeft > 0,
      }
    })
  }

  if (loading) return <p className="loading">Loading event</p>

  if (error) {
    return (
      <p className="error" role="alert">
        {error.code === 'NOT_FOUND' ? 'This event does not exist.' : `Could not load the event: ${error.message}`}
      </p>
    )
  }

  const isOwner = user?.role === ROLES.ORGANIZER && String(event.organizer) === String(user.id)

  return (
    <article>
      <header className="event-hero" data-cat={event.category}>
        <DateStub iso={event.startDateTime} className="hero-stub" />
        <div className="hero-text">
          <CategoryTag category={event.category} />
          <h1>{event.title}</h1>
          <StatusBadge status={event.status} />
        </div>
      </header>

      <div className="event-layout">
        <section>
          <span className="eyebrow">About this event</span>
          <div style={{ marginTop: 12 }}>
            {event.description ? (
              <p className="prose description">{event.description}</p>
            ) : (
              <p className="prose prose-empty">The organizer has not added a description.</p>
            )}
          </div>
        </section>

        <aside className="panel panel-sticky">
          <dl className="facts">
            <div>
              <dt>Venue</dt>
              <dd>{event.venue}</dd>
            </div>
            <div>
              <dt>Starts</dt>
              <dd>{formatDate(event.startDateTime)}</dd>
            </div>
            <div>
              <dt>Ends</dt>
              <dd>{formatDate(event.endDateTime)}</dd>
            </div>
            <div>
              <dt>Register by</dt>
              <dd>{formatDate(event.registrationDeadline)}</dd>
            </div>
          </dl>

          <SeatsMeter event={event} />

          <p className={event.registrationOpen ? 'open' : 'closed'}>
            {event.registrationOpen ? 'Registration is open' : 'Registration is closed'}
          </p>

          {/* Students register; the organizer who owns the event gets management links instead. */}
          {isStudent && registered !== null && (
            <RegisterButton event={event} onRegistered={handleRegistered} alreadyRegistered={registered} />
          )}
          {isOwner && (
            <div className="owner-tools">
              <span className="eyebrow">You run this event</span>
              {(event.status === 'Upcoming' || event.status === 'Ongoing') && (
                <Link to={`/organizer/events/${event._id}/edit`} className="button">Edit or cancel</Link>
              )}
              <Link to={`/organizer/events/${event._id}/attendance`} className="button button-ghost">Attendance</Link>
              <Link to={`/organizer/events/${event._id}/participants`} className="button button-ghost">Participants</Link>
              <Link to={`/organizer/events/${event._id}/report`} className="button button-ghost">Report</Link>
            </div>
          )}
        </aside>
      </div>
    </article>
  )
}

// DISC-04, DISC-05, DISC-06: one event with its status, seats left and registration availability
export default function EventDetailsPage() {
  const { id } = useParams()
  return (
    <main className="page">
      <Link to="/events" className="back-link">
        <Icon name="arrowLeft" size={14} /> All events
      </Link>
      {/* key={id} starts a fresh page whenever the event changes */}
      <EventDetails key={id} id={id} />
    </main>
  )
}
