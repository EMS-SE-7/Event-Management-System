import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyReports } from '../api/reportApi'

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

  if (loading) {
    return <p className="page">Loading reports...</p>
  }

  return (
    <div className="page">
      <Link to="/organizer/attendance" className="back-link">&larr; Back to attendance</Link>
      <h2 className="page-title">Event reports</h2>
      <p className="muted">Registration and attendance numbers for the events you manage.</p>

      {error && <p role="alert" className="error">{error}</p>}

      {totals && (
        <div className="summary">
          <div className="chip"><strong>{totals.registrations}</strong> Total registrations</div>
          <div className="chip chip-present"><strong>{totals.present}</strong> Present</div>
          <div className="chip chip-absent"><strong>{totals.absent}</strong> Absent</div>
        </div>
      )}

      {!error && events.length === 0 && <p className="muted">You have no events yet.</p>}

      {events.length > 0 && (
        <div className="card table-card">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th className="right">Registered</th>
                <th className="right">Present</th>
                <th className="right">Absent</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>
                    <Link to={`/organizer/events/${event.id}/report`}>{event.title}</Link>
                    <div className="muted small">{event.status}</div>
                  </td>
                  <td className="right">
                    {event.registration.total}
                    {event.registration.capacity !== null && ` / ${event.registration.capacity}`}
                  </td>
                  <td className="right">{event.attendance.present}</td>
                  <td className="right">{event.attendance.absent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
