import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cancelRegistration, getMyRegistrations } from '../../api/registrations.js'
import { formatDate } from '../../utils/format.js'

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
      <div className="page-head">
        <h1>My registrations</h1>
        <label>
          Show{' '}
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            aria-label="Filter by status"
          >
            {FILTERS.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p className="muted">Loading your registrations...</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {!loading && !error && registrations.length === 0 && (
        <p className="muted">
          {filter === 'All'
            ? 'You have not registered for any events yet.'
            : `You have no ${filter.toLowerCase()} registrations.`}{' '}
          <Link to="/events">Browse events</Link>
        </p>
      )}

      <ul className="event-list">
        {registrations.map((registration) => {
          const event = registration.event || {}
          const active = registration.isActive ?? registration.status === 'Registered'
          return (
            <li key={registration._id} className="event-card">
              <div className="event-card-head">
                <h2>
                  {event._id ? <Link to={`/events/${event._id}`}>{event.title}</Link> : 'Event unavailable'}
                </h2>
                <span className={`reg-badge ${active ? 'registered' : 'cancelled'}`}>
                  {registration.status}
                </span>
              </div>
              <p className="muted">
                {event.category} &middot; {event.venue} &middot; {formatDate(event.startDateTime)}
              </p>
              <p>{active ? 'Active registration' : 'Cancelled registration'}</p>
              {active && (
                <p className="card-actions">
                  <button
                    type="button"
                    disabled={busyId === registration._id}
                    onClick={() => onCancel(registration)}
                  >
                    {busyId === registration._id ? 'Cancelling...' : 'Cancel registration'}
                  </button>
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </main>
  )
}