import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getEvent, updateEvent } from '../../api/events.js'
import { useAuth } from '../../auth-context'
import StatusBadge from '../../components/StatusBadge.jsx'
import { changedFields, toFormValues } from '../../utils/eventForm.js'
import CancelEventButton from './CancelEventButton.jsx'
import EventForm from './EventForm.jsx'
import PageHead from '../../components/PageHead.jsx'

function EditEvent({ id }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    getEvent(id)
      .then((result) => {
        if (!cancelled) setEvent(result.data)
      })
      .catch((err) => {
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <p className="loading">Loading event</p>

  if (error) {
    return (
      <p className="error" role="alert">
        {error.code === 'NOT_FOUND' ? 'This event does not exist.' : `Could not load the event: ${error.message}`}
      </p>
    )
  }

  // The server checks ownership too (EVENT-07); this only avoids showing a form that would fail.
  if (user && String(event.organizer) !== String(user.id)) {
    return <p className="error" role="alert">You can only edit events you created.</p>
  }

  if (event.status === 'Cancelled' || event.status === 'Completed') {
    return (
      <div className="empty">
        This event is {event.status.toLowerCase()}, so it can no longer be changed.
      </div>
    )
  }

  const initialValues = toFormValues(event)

  async function handleSubmit(values) {
    const changes = changedFields(initialValues, values)
    if (Object.keys(changes).length > 0) {
      await updateEvent(id, changes)
    }
    navigate(`/events/${id}`)
  }

  return (
    <>
      <PageHead eyebrow={event.title} title="Edit event" intro={`${event.registeredCount} students registered. Capacity cannot go below that.`}>
        <StatusBadge status={event.status} />
      </PageHead>
      <EventForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
        submittingLabel="Saving..."
        errorPrefix="Could not save the event"
      />
      <CancelEventButton event={event} onCancelled={() => navigate('/organizer/events')} />
    </>
  )
}

// EVENT-04, EVENT-05, EVENT-07, EVENT-08: the owner edits or cancels an upcoming or ongoing event.
export default function EditEventPage() {
  const { id } = useParams()
  return (
    <main className="page page-narrow">
      <Link to="/organizer/events" className="back-link">&larr; My events</Link>
      <EditEvent key={id} id={id} />
    </main>
  )
}
