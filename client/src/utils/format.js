export function formatDate(iso) {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export function seatsText(event) {
  if (event.isFull) return 'Full'
  return `${event.seatsLeft} of ${event.capacity} seats left`
}
