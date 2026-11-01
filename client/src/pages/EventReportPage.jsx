import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEventReport } from '../api/reportApi'

function StatCard({ label, value, note }) {
  return (
    <div className="card stat-card">
      <div className="muted small">{label}</div>
      <div className="stat-value">{value}</div>
      {note && <div className="muted small">{note}</div>}
    </div>
  )
}

export default function EventReportPage() {
  const { eventId } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getEventReport(eventId)
      .then((data) => setReport(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [eventId])

  if (loading) {
    return <p className="page">Loading report...</p>
  }

  if (error) {
    return (
      <div className="page">
        <Link to="/organizer/reports" className="back-link">&larr; Back to reports</Link>
        <p role="alert" className="error">{error}</p>
      </div>
    )
  }

  const { event, registration, attendance } = report
  const marked = attendance.present + attendance.absent

  return (
    <div className="page">
      <Link to="/organizer/reports" className="back-link">&larr; Back to reports</Link>
      <h2 className="page-title">{event.title}</h2>
      <p className="muted">{event.venue} &middot; {event.status}</p>

      <h3>Registration statistics</h3>
      <div className="stat-grid">
        <StatCard label="Total registrations" value={registration.total} />
        <StatCard
          label="Capacity"
          value={registration.capacity ?? '-'}
          note={registration.seatsLeft !== null ? `${registration.seatsLeft} seats left` : ''}
        />
        <StatCard label="Filled" value={`${registration.fillRate}%`} />
        <StatCard label="Cancelled" value={registration.cancelled} />
      </div>

      <h3>Attendance statistics</h3>
      <div className="stat-grid">
        <StatCard label="Present" value={attendance.present} />
        <StatCard label="Absent" value={attendance.absent} />
        <StatCard label="Not marked" value={attendance.notMarked} />
      </div>

      {registration.total > 0 && (
        <div className="progress" title={`${marked} of ${registration.total} marked`}>
          <div className="progress-present" style={{ width: `${(attendance.present / registration.total) * 100}%` }} />
          <div className="progress-absent" style={{ width: `${(attendance.absent / registration.total) * 100}%` }} />
        </div>
      )}

      <p>
        <Link to={`/organizer/events/${event.id}/attendance`}>Go to attendance for this event</Link>
      </p>
    </div>
  )
}
