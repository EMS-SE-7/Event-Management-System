import { Link, useNavigate } from 'react-router-dom'
import { createEvent } from '../../api/events.js'
import { toPayload } from '../../utils/eventForm.js'
import EventForm from './EventForm.jsx'
import PageHead from '../../components/PageHead.jsx'

// EVENT-01, EVENT-02, EVENT-03, EVENT-08: organizers create an event.
// The rules are checked by the API (or the sample data layer); their messages are shown next to each field.
export default function CreateEventPage() {
  const navigate = useNavigate()

  async function handleSubmit(values) {
    const result = await createEvent(toPayload(values))
    navigate(`/events/${result.data._id}`)
  }

  return (
    <main className="page page-narrow">
      <Link to="/organizer/events" className="back-link">&larr; My events</Link>
      <PageHead eyebrow="New event" title="Create event" intro="Students can register as soon as you save, until the registration deadline or until the seats run out." />
      <EventForm onSubmit={handleSubmit} submitLabel="Create event" submittingLabel="Creating..." errorPrefix="Could not create the event" />
    </main>
  )
}
