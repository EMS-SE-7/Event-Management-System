import { useState } from 'react'
import { cancelEvent } from '../../api/events.js'

// EVENT-05: cancels the event after the organizer confirms. The event is kept and shows as Cancelled.
export default function CancelEventButton({ event, onCancelled }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    const warning = event.registeredCount > 0
      ? `Cancel "${event.title}"? ${event.registeredCount} registered students will see it as cancelled.`
      : `Cancel "${event.title}"?`
    if (!window.confirm(warning)) return

    setSaving(true)
    setError('')
    try {
      const result = await cancelEvent(event._id)
      onCancelled(result.data)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="danger-zone">
      <h2>Cancel this event</h2>
      <p className="muted">Registration closes and the event shows as Cancelled. This cannot be undone.</p>
      {error && <p className="error" role="alert">Could not cancel the event: {error}</p>}
      <button type="button" className="button button-danger" onClick={handleClick} disabled={saving}>
        {saving ? 'Cancelling...' : 'Cancel event'}
      </button>
    </div>
  )
}
