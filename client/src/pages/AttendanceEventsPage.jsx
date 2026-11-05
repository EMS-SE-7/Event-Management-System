import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyEvents } from '../api/attendanceApi'
import PageHead from '../components/PageHead.jsx'
import StatusBadge from '../components/StatusBadge.jsx'

export default function AttendanceEventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyEvents()
      .then((data) => setEvents(data.events))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="page">
      <PageHead eyebrow="Organizer" title="Take attendance" intro="Pick one of your events to mark who turned up.">
        <Link to="/organizer/reports" className="button button-ghost">View event reports</Link>
      </PageHead>

      {loading && <p className="loading">Loading events</p>}
      {error && <p role="alert" className="error">{error}</p>}
      {!loading && !error && events.length === 0 && <div className="empty">You have no events yet.</div>}

      {events.length > 0 && (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Status</th>
                <th className="num">Registered</th>
                <th className="right">&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>
                    <Link to={`/organizer/events/${event.id}/attendance`} className="student-name">{event.title}</Link>
                  </td>
                  <td><StatusBadge status={event.status} /></td>
                  <td className="num">{event.registered}</td>
                  <td className="right">
                    <Link to={`/organizer/events/${event.id}/report`} className="small">Report</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
