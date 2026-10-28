import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyEvents } from '../api/attendanceApi'

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

  if (loading) {
    return <p className="page">Loading events...</p>
  }

  return (
    <div className="page">
      <h2>Take attendance</h2>
      <p>Pick one of your events.</p>

      {error && <p role="alert" className="error">{error}</p>}

      {!error && events.length === 0 && <p>You have no events yet.</p>}

      <ul className="event-list">
        {events.map((event) => (
          <li key={event.id}>
            <Link to={`/organizer/events/${event.id}/attendance`}>{event.title}</Link>
            {' '}- {event.status}, {event.registered} registered
          </li>
        ))}
      </ul>
    </div>
  )
}
