import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEventAttendance, markAttendance } from '../api/attendanceApi'

function statusOf(reg) {
  return reg.attendanceStatus || 'Not Marked'
}

export default function AttendancePage() {
  const { eventId } = useParams()
  const [eventTitle, setEventTitle] = useState('')
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
    }
  }

  if (loading) {
    return <p className="muted">Loading attendance...</p>
  }

  const count = (s) => registrations.filter((reg) => statusOf(reg) === s).length

  return (
    <>
      <Link to="/organizer/attendance" className="back-link">&larr; Back to events</Link>
      <h2 className="page-title">{eventTitle}</h2>
      <p className="muted">Mark each registered student as Present or Absent. You can change it any time.</p>

      {error && <p role="alert" className="error">{error}</p>}

      <div className="summary">
        <div className="chip chip-present"><strong>{count('Present')}</strong> Present</div>
        <div className="chip chip-absent"><strong>{count('Absent')}</strong> Absent</div>
        <div className="chip chip-pending"><strong>{count('Not Marked')}</strong> Not marked</div>
      </div>

      {registrations.length === 0 ? (
        <p className="muted">No registered students yet.</p>
      ) : (
        <div className="card table-card">
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
                        <span className="avatar">{name.charAt(0).toUpperCase()}</span>
                        <div>
                          <div className="student-name">{name}</div>
                          <div className="muted small">{reg.student?.email || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${status.replace(' ', '-').toLowerCase()}`}>{status}</span>
                    </td>
                    <td className="right">
                      <button
                        type="button"
                        className={`btn-present ${status === 'Present' ? 'active' : ''}`}
                        onClick={() => handleMark(reg._id, 'Present')}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        className={`btn-absent ${status === 'Absent' ? 'active' : ''}`}
                        onClick={() => handleMark(reg._id, 'Absent')}
                      >
                        Absent
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
