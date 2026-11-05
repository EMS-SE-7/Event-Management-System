import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyReports } from '../api/reportApi'
import PageHead from '../components/PageHead.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { formatDate } from '../utils/format.js'

export default function ReportsPage() {
  const [events, setEvents] = useState([])
  const [totals, setTotals] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyReports()
      .then((data) => {
        setEvents(data.events)
        setTotals(data.totals)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="page">
      <PageHead eyebrow="Organizer" title="Event reports" intro="Registration and attendance numbers for the events you manage.">
        <Link to="/organizer/attendance" className="button button-ghost">Take attendance</Link>
      </PageHead>

      {loading && <p className="loading">Loading reports</p>}
      {error && <p role="alert" className="error">{error}</p>}

      {totals && (
        <div className="stats" style={{ marginBottom: 28 }}>
          <div className="stat"><span className="stat-label">Events</span><span className="stat-value">{events.length}</span></div>
          <div className="stat"><span className="stat-label">Total registrations</span><span className="stat-value">{totals.registrations}</span></div>
          <div className="stat stat-present"><span className="stat-label">Present</span><span className="stat-value">{totals.present}</span></div>
          <div className="stat stat-absent"><span className="stat-label">Absent</span><span className="stat-value">{totals.absent}</span></div>
        </div>
      )}

      {!loading && !error && events.length === 0 && <div className="empty">You have no events yet.</div>}

      {events.length > 0 && (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Status</th>
                <th>Filled</th>
                <th className="num">Registered</th>
                <th className="num">Present</th>
                <th className="num">Absent</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>
                    <Link to={`/organizer/events/${event.id}/report`} className="student-name">{event.title}</Link>
                    {event.startDateTime && <div className="muted small">{formatDate(event.startDateTime)}</div>}
                  </td>
                  <td><StatusBadge status={event.status} /></td>
                  <td style={{ minWidth: 120 }}>
                    <div className="meter">
                      <div className="meter-track" aria-hidden="true">
                        <div className={`meter-fill${event.registration.fillRate >= 80 ? ' is-hot' : ''}`} style={{ width: `${Math.min(event.registration.fillRate, 100)}%` }} />
                      </div>
                      <span className="mono muted">{event.registration.fillRate}%</span>
                    </div>
                  </td>
                  <td className="num">
                    {event.registration.total}
                    {event.registration.capacity !== null && <span className="muted small"> / {event.registration.capacity}</span>}
                  </td>
                  <td className="num" style={{ color: 'var(--green)' }}>{event.attendance.present}</td>
                  <td className="num" style={{ color: 'var(--red)' }}>{event.attendance.absent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
