import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cancelRegistration, getMyRegistrations } from '../../api/registrations.js'
import CategoryTag from '../../components/CategoryTag.jsx'
import DateStub from '../../components/DateStub.jsx'
import Icon from '../../components/Icon.jsx'
import PageHead from '../../components/PageHead.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'

const FILTERS = ['All', 'Registered', 'Cancelled']

// HIST-01 to HIST-04, REG-07: the student's registration history with a cancel button.
export default function MyRegistrationsPage() {
  const [registrations, setRegistrations] = useState([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  // Fetch inside the effect and set state only in the callbacks (keeps the linter happy).
  useEffect(() => {
    let cancelled = false
    getMyRegistrations(filter === 'All' ? '' : filter)
      .then((result) => {
        if (cancelled) return
        setRegistrations(Array.isArray(result.data) ? result.data : [])
        setError('')
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
  }, [filter, reloadKey])

  const onFilterChange = (value) => {
    if (value === filter) return
    setLoading(true)
    setFilter(value)
  }

  const onCancel = async (registration) => {
    if (!window.confirm(`Cancel your registration for "${registration.event?.title}"?`)) return
    setBusyId(registration._id)
    setError('')
    try {
      await cancelRegistration(registration._id)
      setReloadKey((key) => key + 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId('')
    }
  }

  return (
    <main className="page">
      <PageHead eyebrow="Student" title="My registrations" intro="Every event you have signed up for. You can cancel up until the event starts.">
        <div className="segment-tabs" role="group" aria-label="Filter by status">
          {FILTERS.map((name) => (
            <button key={name} type="button" aria-pressed={filter === name} onClick={() => onFilterChange(name)}>
              {name}
            </button>
          ))}
        </div>
      </PageHead>

      {loading && <p className="loading">Loading your registrations</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {!loading && !error && registrations.length === 0 && (
        <div className="empty">
          <span>
            {filter === 'All'
              ? 'You have not registered for any events yet.'
              : `You have no ${filter.toLowerCase()} registrations.`}
          </span>
          <Link to="/events" className="button button-small">Browse events</Link>
        </div>
      )}

      <ul className="event-list">
        {registrations.map((registration) => {
          const event = registration.event || {}
          const active = registration.isActive ?? registration.status === 'Registered'
          const started = event.status === 'Ongoing' || event.status === 'Completed'
          return (
            <li key={registration._id} className={`event-card${active ? '' : ' is-cancelled'}`} data-cat={event.category}>
              <DateStub iso={event.startDateTime} />
              <div className="ticket-body">
                <div className="event-card-head">
                  <CategoryTag category={event.category} />
                  <StatusBadge status={registration.status} />
                </div>
                <h2>
                  {event._id ? <Link to={`/events/${event._id}`}>{event.title}</Link> : 'Event unavailable'}
                </h2>
                <p className="ticket-meta">
                  {event.venue && <span><Icon name="pin" />{event.venue}</span>}
                  {event.status && <span>Event {event.status.toLowerCase()}</span>}
                  {registration.attendanceStatus && registration.attendanceStatus !== 'Not Marked' && (
                    <span>Marked {registration.attendanceStatus.toLowerCase()}</span>
                  )}
                </p>
                {active && !started && event.status !== 'Cancelled' && (
                  <div className="card-actions">
                    <button
                      type="button"
                      className="button button-ghost button-small"
                      disabled={busyId === registration._id}
                      onClick={() => onCancel(registration)}
                    >
                      {busyId === registration._id ? 'Cancelling…' : 'Cancel registration'}
                    </button>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
