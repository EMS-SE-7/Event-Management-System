import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEventReport } from '../api/reportApi'
import PageHead from '../components/PageHead.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { formatDate } from '../utils/format.js'

function Stat({ label, value, note, tone }) {
  return (
    <div className={`stat${tone ? ` stat-${tone}` : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {note && <span className="stat-note">{note}</span>}
    </div>
  )
}

const pct = (part, whole) => (whole ? (part / whole) * 100 : 0)

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
    return <main className="page"><p className="loading">Loading report</p></main>
  }

  if (error) {
    return (
      <main className="page">
        <Link to="/organizer/reports" className="back-link">&larr; All reports</Link>
        <p role="alert" className="error">{error}</p>
      </main>
    )
  }

  const { event, registration, attendance } = report
  const marked = attendance.present + attendance.absent
  const intro = [event.venue, event.startDateTime && formatDate(event.startDateTime)].filter(Boolean).join(' · ')

  return (
    <main className="page">
      <Link to="/organizer/reports" className="back-link">&larr; All reports</Link>
      <PageHead eyebrow="Event report" title={event.title} intro={intro}>
        <StatusBadge status={event.status} />
        <Link to={`/organizer/events/${event.id}/attendance`} className="button button-ghost">Go to attendance</Link>
      </PageHead>

      <section>
        <div className="section-head"><h2>Registrations</h2></div>
        <div className="stats">
          <Stat label="Registered" value={registration.total} note={registration.capacity !== null ? `of ${registration.capacity} seats` : ''} />
          <Stat label="Seats left" value={registration.seatsLeft ?? '–'} />
          <Stat label="Filled" value={`${registration.fillRate}%`} />
          <Stat label="Cancelled" value={registration.cancelled} note="registrations withdrawn" />
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Attendance</h2>
          <span className="mono muted">{marked} of {registration.total} marked</span>
        </div>
        <div className="stats">
          <Stat label="Present" value={attendance.present} tone="present" />
          <Stat label="Absent" value={attendance.absent} tone="absent" />
          <Stat label="Not marked" value={attendance.notMarked} />
        </div>

        {registration.total > 0 && (
          <div style={{ marginTop: 20 }}>
            <div className="split-bar" title={`${marked} of ${registration.total} marked`}>
              <div className="seg-present" style={{ width: `${pct(attendance.present, registration.total)}%` }} />
              <div className="seg-absent" style={{ width: `${pct(attendance.absent, registration.total)}%` }} />
            </div>
            <div className="legend">
              <span><i style={{ background: 'var(--green)' }} /> Present</span>
              <span><i style={{ background: 'var(--red)' }} /> Absent</span>
              <span><i style={{ background: 'var(--sunken)', border: '1px solid var(--line-strong)' }} /> Not marked</span>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
