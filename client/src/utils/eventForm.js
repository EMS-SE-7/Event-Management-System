// Converting between the Event Form's values and the API's event shape.

export const EMPTY_EVENT = {
  title: '',
  category: '',
  venue: '',
  description: '',
  startDateTime: '',
  endDateTime: '',
  registrationDeadline: '',
  capacity: '',
}

const DATE_FIELDS = ['startDateTime', 'endDateTime', 'registrationDeadline']

// Turns the form values into what the API expects. Empty fields are left out,
// so the server reports them as "required". Date inputs give local time, sent as ISO.
export function toPayload(values) {
  const payload = {}
  for (const [key, value] of Object.entries(values)) {
    if (value === '') continue
    if (DATE_FIELDS.includes(key)) payload[key] = new Date(value).toISOString()
    else if (key === 'capacity') payload[key] = Number(value)
    else payload[key] = value
  }
  return payload
}

// ISO date -> the "YYYY-MM-DDTHH:mm" local time a datetime-local input shows.
function toLocalInput(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  const offset = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

// An event from the API -> values for the Event Form (Edit Event).
export function toFormValues(event) {
  return {
    title: event.title ?? '',
    category: event.category ?? '',
    venue: event.venue ?? '',
    description: event.description ?? '',
    startDateTime: toLocalInput(event.startDateTime),
    endDateTime: toLocalInput(event.endDateTime),
    registrationDeadline: toLocalInput(event.registrationDeadline),
    capacity: event.capacity == null ? '' : String(event.capacity),
  }
}

// Only the fields that differ from the original, so unchanged dates are not
// re-checked as "must be in the future" by the server.
export function changedFields(original, values) {
  const before = toPayload(original)
  const after = toPayload(values)
  const changes = {}
  for (const key of Object.keys(EMPTY_EVENT)) {
    if (after[key] !== before[key]) changes[key] = key in after ? after[key] : ''
  }
  return changes
}
