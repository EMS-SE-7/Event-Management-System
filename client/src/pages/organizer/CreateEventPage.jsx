import { Link, useNavigate } from 'react-router-dom'
import { createEvent } from '../../api/events.js'
import { toPayload } from '../../utils/eventForm.js'
import EventForm from './EventForm.jsx'

// EVENT-01, EVENT-02, EVENT-03, EVENT-08: organizers create an event.
// The rules are checked by the API (or the sample data layer); their messages are shown next to each field.
export default function CreateEventPage() {
  const navigate = useNavigate()

  async function handleSubmit(values) {
    const result = await createEvent(toPayload(values))
    navigate(`/events/${result.data._id}`)
  }

  return (
    <main className="page">
      <p>
        <Link to="/events">&larr; Back to events</Link>
      </p>
      <h1>Create event</h1>
      <EventForm onSubmit={handleSubmit} submitLabel="Create event" submittingLabel="Creating..." errorPrefix="Could not create the event" />
    </main>
  )
}
