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
