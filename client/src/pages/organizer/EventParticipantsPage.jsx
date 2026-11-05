import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEventParticipants } from '../../api/registrations.js'
import PageHead from '../../components/PageHead.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { initials } from '../../utils/format.js'

// PART-01, PART-02: registered students of one event (the server only allows its own organizer).
export default function EventParticipantsPage() {
  const { eventId } = useParams()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getEventParticipants(eventId)
      .then((result) => {
        if (cancelled) return
        const data = result.data
        setRows(Array.isArray(data) ? data : data?.participants || [])
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
  }, [eventId])

  return (
    <main className="page">
      <Link to="/organizer/events" className="back-link">&larr; My events</Link>
      <PageHead eyebrow="Organizer" title="Registered participants" intro="Students with an active registration for this event.">
        <Link to={`/organizer/events/${eventId}/attendance`} className="button button-ghost">Take attendance</Link>
      </PageHead>

      {loading && <p className="loading">Loading participants</p>}
      {error && <p className="error" role="alert">Could not load participants: {error}</p>}
      {!loading && !error && rows.length === 0 && <div className="empty">No students have registered yet.</div>}

      {rows.length > 0 && (
        <>
          <p className="result-count">{rows.length} registered</p>
          <div className="table-card">
            <table className="participants-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Registration</th>
                  <th>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row._id}>
                    <td>
                      <div className="student">
                        <span className="avatar avatar-quiet">{initials(row.student?.name || '?')}</span>
                        <div>
                          <div className="student-name">{row.student?.name || 'Unknown student'}</div>
                          <div className="muted small">{row.student?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><StatusBadge status={row.status} /></td>
                    <td><StatusBadge status={row.attendanceStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  )
}
