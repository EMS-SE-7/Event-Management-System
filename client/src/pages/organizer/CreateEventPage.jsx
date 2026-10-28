import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createEvent } from '../../api/events.js'
import { CATEGORIES } from '../../utils/categories.js'

const EMPTY = {
  title: '',
  category: '',
  venue: '',
  description: '',
  startDateTime: '',
  endDateTime: '',
  registrationDeadline: '',
  capacity: '',
}

// Turns the form values into what the API expects. Empty fields are left out,
// so the server reports them as "required". Date inputs give local time, sent as ISO.
function toPayload(values) {
  const payload = {}
  for (const [key, value] of Object.entries(values)) {
    if (value === '') continue
    if (key.endsWith('DateTime') || key === 'registrationDeadline') payload[key] = new Date(value).toISOString()
    else if (key === 'capacity') payload[key] = Number(value)
    else payload[key] = value
  }
  return payload
}

function Field({ label, name, error, children }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {children}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// EVENT-01, EVENT-02, EVENT-03, EVENT-08: organizers create an event.
// The rules are checked by the API (or the sample data layer); their messages are shown next to each field.
export default function CreateEventPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    setFormError('')
    try {
      const result = await createEvent(toPayload(values))
      navigate(`/events/${result.data._id}`)
    } catch (err) {
      if (err.code === 'VALIDATION_ERROR') setErrors(err.details || {})
      else setFormError(err.message)
      setSubmitting(false)
    }
  }

  const input = (name, props = {}) => (
    <input id={name} name={name} value={values[name]} onChange={handleChange} aria-invalid={Boolean(errors[name])} {...props} />
  )

  return (
    <main className="page">
      <p>
        <Link to="/events">&larr; Back to events</Link>
      </p>
      <h1>Create event</h1>

      <form onSubmit={handleSubmit} noValidate className="event-form">
        <Field label="Title" name="title" error={errors.title}>
          {input('title', { type: 'text' })}
        </Field>

        <Field label="Category" name="category" error={errors.category}>
          <select id="category" name="category" value={values.category} onChange={handleChange} aria-invalid={Boolean(errors.category)}>
            <option value="">Choose a category</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Venue" name="venue" error={errors.venue}>
          {input('venue', { type: 'text' })}
        </Field>

        <Field label="Description (optional)" name="description" error={errors.description}>
          <textarea id="description" name="description" rows={4} value={values.description} onChange={handleChange} aria-invalid={Boolean(errors.description)} />
        </Field>

        <div className="field-row">
          <Field label="Starts" name="startDateTime" error={errors.startDateTime}>
            {input('startDateTime', { type: 'datetime-local' })}
          </Field>
          <Field label="Ends" name="endDateTime" error={errors.endDateTime}>
            {input('endDateTime', { type: 'datetime-local' })}
          </Field>
        </div>

        <div className="field-row">
          <Field label="Registration deadline" name="registrationDeadline" error={errors.registrationDeadline}>
            {input('registrationDeadline', { type: 'datetime-local' })}
          </Field>
          <Field label="Capacity" name="capacity" error={errors.capacity}>
            {input('capacity', { type: 'number', min: 1 })}
          </Field>
        </div>

        {formError && (
          <p className="error" role="alert">
            Could not create the event: {formError}
          </p>
        )}

        <button type="submit" className="button" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create event'}
        </button>
      </form>
    </main>
  )
}
