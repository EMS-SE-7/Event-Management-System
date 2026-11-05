export function formatDate(iso) {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

// Pieces of a date for the ticket stub: { month: 'NOV', day: '12', weekday: 'WED', time: '9:00 am' }
export function dateParts(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return { month: '', day: '–', weekday: '', time: '' }
  return {
    month: date.toLocaleString('en-IN', { month: 'short' }).toUpperCase(),
    day: String(date.getDate()),
    weekday: date.toLocaleString('en-IN', { weekday: 'short' }).toUpperCase(),
    time: formatTime(iso),
  }
}

export function seatsText(event) {
  if (event.isFull) return 'Full'
  return `${event.seatsLeft} of ${event.capacity} seats left`
}

// "Asha Rao" -> "AR"
export function initials(name = '') {
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean)
  return (parts[0]?.[0] || '?').toUpperCase() + (parts[1]?.[0] || '').toUpperCase()
}

export function greeting(now = new Date()) {
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
