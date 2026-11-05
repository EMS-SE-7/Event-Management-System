import { useState } from 'react'
import { Link } from 'react-router-dom'
import { registerForEvent } from '../api/registrations.js'

// Messages for the error codes in section 3 of the team integration guide.
const MESSAGES = {
  ALREADY_REGISTERED: 'You are already registered for this event.',
  EVENT_FULL: 'Sorry, this event is full.',
  DEADLINE_PASSED: 'The registration deadline has passed.',
  EVENT_CANCELLED: 'This event has been cancelled.',
  EVENT_NOT_UPCOMING: 'Registration is only open for upcoming events.',
  UNAUTHENTICATED: 'Please log in as a student to register.',
  FORBIDDEN: 'Only students can register for events.',
  NOT_FOUND: 'This event no longer exists.',
}

// REG-01 to REG-05 on the Event Details page.
// The server makes the final decision; this button only shows the result.
// alreadyRegistered comes from the student's own registrations, so a reload still shows the right state.
export default function RegisterButton({ event, onRegistered, alreadyRegistered = false }) {
  const [state, setState] = useState('idle') // idle | saving | done
  const [message, setMessage] = useState('')

  async function handleClick() {
    setState('saving')
    setMessage('')
    try {
      await registerForEvent(event._id ?? event.id)
      setState('done')
      if (onRegistered) onRegistered()
    } catch (err) {
      if (err.code === 'ALREADY_REGISTERED') {
        setState('done')
        return
      }
      setState('idle')
      setMessage(MESSAGES[err.code] || `Could not register: ${err.message}`)
    }
  }

  if (state === 'done' || alreadyRegistered) {
    return (
      <div className="register-slot">
        <p className="notice" role="status">
          You are registered for this event.
        </p>
        <Link to="/student/registrations" className="small">Manage in My Registrations</Link>
      </div>
    )
  }

  if (!event.registrationOpen) {
    return (
      <div className="register-slot">
        <button type="button" className="button" disabled>
          Registration closed
        </button>
      </div>
    )
  }

  return (
    <div className="register-slot">
      <button type="button" className="button button-signal" onClick={handleClick} disabled={state === 'saving'}>
        {state === 'saving' ? 'Registering…' : 'Register for this event'}
      </button>
      {message && (
        <p className="error" role="alert">
          {message}
        </p>
      )}
    </div>
  )
}
