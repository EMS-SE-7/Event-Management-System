import { useState } from 'react'
import { CATEGORIES } from '../../utils/categories.js'
import { EMPTY_EVENT } from '../../utils/eventForm.js'

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

// The event fields shared by Create Event and Edit Event (EVENT-02, EVENT-08).
// onSubmit gets the form values and returns a promise; a VALIDATION_ERROR from it
// is shown next to each field, any other error above the button.
export default function EventForm({ initialValues = EMPTY_EVENT, onSubmit, submitLabel, submittingLabel, errorPrefix }) {
  const [values, setValues] = useState(initialValues)
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
      await onSubmit(values)
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
    <form onSubmit={handleSubmit} noValidate className="event-form">
      <div className="form-section">
        <span className="form-section-title">The basics</span>
        <Field label="Title" name="title" error={errors.title}>
          {input('title', { type: 'text', placeholder: 'e.g. Hackathon 2026' })}
        </Field>

        <div className="field-row">
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
            {input('venue', { type: 'text', placeholder: 'e.g. MRD Auditorium' })}
          </Field>
        </div>

        <Field label="Description (optional)" name="description" error={errors.description}>
          <textarea id="description" name="description" rows={4} value={values.description} onChange={handleChange} aria-invalid={Boolean(errors.description)} />
        </Field>
      </div>

      <div className="form-section">
        <span className="form-section-title">When and how many</span>
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
            {input('capacity', { type: 'number', min: 1, placeholder: 'Seats' })}
          </Field>
        </div>
      </div>

      {formError && (
        <p className="error" role="alert">
          {errorPrefix}: {formError}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" className="button button-signal" disabled={submitting}>
          {submitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </form>
  )
}
