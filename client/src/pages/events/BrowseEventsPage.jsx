import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { listEvents } from '../../api/events.js'
import { ROLES, useAuth } from '../../auth-context'
import EventCard from '../../components/EventCard.jsx'
import PageHead from '../../components/PageHead.jsx'
import SeatsMeter from '../../components/SeatsMeter.jsx'
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
      {!loading && !error && events.length > 0 && (
        <p className="result-count">{total} {total === 1 ? 'event' : 'events'}</p>
      )}
      {loading && <p className="loading">Loading events</p>}
      {error && <p className="error" role="alert">Could not load events: {error}</p>}
      {!loading && !error && events.length === 0 && (
        <div className="empty">{filtered ? 'No events match these filters.' : 'There are no events yet.'}</div>
      )}

      <ul className="event-list">
        {events.map((event) => (
          <EventCard
            key={event._id}
            event={event}
            foot={
              <SeatsMeter event={event}>
                <span className={event.registrationOpen ? 'open' : 'closed'}>
                  {event.registrationOpen ? 'Registration open' : 'Registration closed'}
                </span>
              </SeatsMeter>
            }
          />
        ))}
      </ul>

      {!loading && pages > 1 && (
        <nav className="pager" aria-label="Pages">
          <button type="button" className="button button-ghost button-small" disabled={page <= 1} onClick={() => onPage(page - 1)}>
            &larr; Previous
          </button>
          <span className="muted">Page {page} of {pages}</span>
          <button type="button" className="button button-ghost button-small" disabled={page >= pages} onClick={() => onPage(page + 1)}>
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
      <PageHead eyebrow="What's on" title="Browse events" intro="Talks, fests, workshops and matches across campus. Search by name or venue, or narrow it down by category and status.">
        {user?.role === ROLES.ORGANIZER && (
          <Link to="/organizer/events/new" className="button button-signal">Create event</Link>
        )}
      </PageHead>

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
