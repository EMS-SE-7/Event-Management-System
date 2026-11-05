import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEventParticipants } from '../../api/registrations.js'

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
      <div className="page-head">
        <h1>Registered participants</h1>
        <Link to="/organizer/events">Back to my events</Link>
      </div>

      {loading && <p className="muted">Loading participants...</p>}
      {error && <p className="error" role="alert">Could not load participants: {error}</p>}
      {!loading && !error && rows.length === 0 && <p className="muted">No students have registered yet.</p>}

      {rows.length > 0 && (
        <table className="participants-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Registration</th>
              <th>Attendance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row._id}>
                <td>{row.student?.name}</td>
                <td>{row.student?.email}</td>
                <td>{row.status}</td>
                <td>{row.attendanceStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}