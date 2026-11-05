import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEventAttendance, markAttendance } from '../api/attendanceApi'
import PageHead from '../components/PageHead.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { initials } from '../utils/format.js'

function statusOf(reg) {
  return reg.attendanceStatus || 'Not Marked'
}

export default function AttendancePage() {
  const { eventId } = useParams()
  const [eventTitle, setEventTitle] = useState('')
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState('')

  useEffect(() => {
    getEventAttendance(eventId)
      .then((data) => {
        setEventTitle(data.event.title)
        setRegistrations(data.registrations)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [eventId])

  async function handleMark(registrationId, status) {
    setSavingId(registrationId)
    try {
      const data = await markAttendance(registrationId, status)

      setRegistrations((current) =>
        current.map((reg) =>
          reg._id === registrationId
            ? { ...reg, attendanceStatus: data.registration.attendanceStatus }
            : reg
        )
      )
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId('')
    }
  }

  const count = (s) => registrations.filter((reg) => statusOf(reg) === s).length

  return (
    <main className="page">
      <Link to="/organizer/attendance" className="back-link">&larr; All events</Link>

      {loading && <p className="loading">Loading attendance</p>}

      {!loading && (
        <>
          <PageHead eyebrow="Attendance" title={eventTitle || 'Attendance'} intro="Mark each registered student as Present or Absent. You can change it any time.">
            <Link to={`/organizer/events/${eventId}/report`} className="button button-ghost">View report</Link>
          </PageHead>

          {error && <p role="alert" className="error">{error}</p>}

          {registrations.length > 0 && (
            <div className="chip-row" style={{ marginBottom: 18 }}>
              <span className="chip"><strong style={{ color: 'var(--green)' }}>{count('Present')}</strong> Present</span>
              <span className="chip"><strong style={{ color: 'var(--red)' }}>{count('Absent')}</strong> Absent</span>
              <span className="chip"><strong>{count('Not Marked')}</strong> Not marked</span>
            </div>
          )}

          {registrations.length === 0 && !error ? (
            <div className="empty">No registered students yet.</div>
          ) : registrations.length > 0 && (
            <div className="table-card">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Status</th>
                    <th className="right">Mark attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg) => {
                    const status = statusOf(reg)
                    const name = reg.student?.name || 'N/A'

                    return (
                      <tr key={reg._id}>
                        <td>
                          <div className="student">
                            <span className="avatar avatar-quiet">{initials(name)}</span>
                            <div>
                              <div className="student-name">{name}</div>
                              <div className="muted small">{reg.student?.email || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td><StatusBadge status={status} /></td>
                        <td className="right">
                          <div className="segmented" role="group" aria-label={`Attendance for ${name}`}>
                            <button
                              type="button"
                              className={`btn-present ${status === 'Present' ? 'active' : ''}`}
                              aria-pressed={status === 'Present'}
                              disabled={savingId === reg._id}
                              onClick={() => handleMark(reg._id, 'Present')}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              className={`btn-absent ${status === 'Absent' ? 'active' : ''}`}
                              aria-pressed={status === 'Absent'}
                              disabled={savingId === reg._id}
                              onClick={() => handleMark(reg._id, 'Absent')}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  )
}
