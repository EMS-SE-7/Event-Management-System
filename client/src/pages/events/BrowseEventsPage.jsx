import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { listEvents } from '../../api/events.js'
import { ROLES, useAuth } from '../../auth-context'
import StatusBadge from '../../components/StatusBadge.jsx'
import { formatDate, seatsText } from '../../utils/format.js'
import EventFilters from './EventFilters.jsx'

// Loads and shows one set of results. It is re-created whenever the filters change,
// so each search starts with a fresh loading state.
const PAGE_SIZE = 10

function EventResults({ q, category, status, page, onPage }) {
  const [events, setEvents] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    listEvents({ q, category, status, page, limit: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return
        setEvents(result.data)
        setTotal(result.meta?.total ?? result.data.length)
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
  }, [q, category, status, page])

  const pages = Math.max(Math.ceil(total / PAGE_SIZE), 1)

  const filtered = q || category || status

  return (
    <>
      {loading && <p className="muted">Loading events...</p>}
      {error && <p className="error" role="alert">Could not load events: {error}</p>}
      {!loading && !error && events.length === 0 && (
        <p className="muted">{filtered ? 'No events match these filters.' : 'There are no events yet.'}</p>
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

      {!loading && pages > 1 && (
        <nav className="pager" aria-label="Pages">
          <button type="button" className="link-button" disabled={page <= 1} onClick={() => onPage(page - 1)}>
            &larr; Previous
          </button>
          <span className="muted">Page {page} of {pages}</span>
          <button type="button" className="link-button" disabled={page >= pages} onClick={() => onPage(page + 1)}>
            Next &rarr;
          </button>
        </nav>
      )}
    </>
  )
}

// DISC-01 to DISC-06: browse events, search and filter them, see status, seats and registration availability.
// The filters live in the URL (?q=&category=&status=), so a filtered list can be shared or refreshed.
export default function BrowseEventsPage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const filters = {
    q: params.get('q') || '',
    category: params.get('category') || '',
    status: params.get('status') || '',
  }
  const page = Math.max(parseInt(params.get('page'), 10) || 1, 1)

  // New filters start again at page 1.
  function handleChange(next, nextPage = 1) {
    const entries = Object.entries({ ...next, page: nextPage > 1 ? String(nextPage) : '' }).filter(([, value]) => value)
    setParams(Object.fromEntries(entries))
  }

  const key = `${filters.q}|${filters.category}|${filters.status}|${page}`

  return (
    <main className="page">
      <div className="page-head">
        <h1>Browse events</h1>
        {user?.role === ROLES.ORGANIZER && (
          <Link to="/organizer/events/new" className="button">Create event</Link>
        )}
      </div>

      <EventFilters filters={filters} onChange={handleChange} />
      <EventResults
        key={key}
        q={filters.q}
        category={filters.category}
        status={filters.status}
        page={page}
        onPage={(next) => handleChange(filters, next)}
      />
    </main>
  )
}
