import { CATEGORIES } from '../utils/categories.js'

// Sample events for the demo, used until the real database is connected.
// Each function returns the same shape as the real API (api/httpEvents.js),
// so the pages cannot tell the difference.

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

// Dates are relative to "now", so every status shows up whenever the demo runs.
function event(id, title, category, venue, startsIn, durationHours, deadlineBeforeStart, capacity, registeredCount, extra = {}) {
  const start = Date.now() + startsIn
  return {
    _id: id,
    title,
    description: '',
    category,
    venue,
    startDateTime: new Date(start).toISOString(),
    endDateTime: new Date(start + durationHours * HOUR).toISOString(),
    registrationDeadline: new Date(start - deadlineBeforeStart).toISOString(),
    capacity,
    registeredCount,
    status: 'Upcoming',
    organizer: '000000000000000000000001',
    ...extra,
  }
}

const stored = [
  event('mock-1', 'Hackathon 2026', 'Technical', 'MRD Auditorium', 7 * DAY, 24, DAY, 100, 42, {
    description: 'A 24 hour coding event. Teams of up to four build a working prototype.',
  }),
  event('mock-2', 'Robotics Workshop', 'Workshop', 'Lab 3, ECE Block', 3 * DAY, 4, DAY, 2, 1, {
    description: 'Build a line-following robot. Only two seats, bring your own laptop.',
  }),
  event('mock-3', 'Cultural Night', 'Cultural', 'Open Air Theatre', 10 * DAY, 3, 2 * DAY, 200, 200, {
    description: 'Music, dance and drama from every department.',
  }),
  event('mock-4', 'Inter-College Football Final', 'Sports', 'Main Ground', 5 * DAY, 2, DAY, 50, 12, {
    status: 'Cancelled',
    description: 'Cancelled because of the weather forecast.',
  }),
  event('mock-5', 'Career Talk: Cloud Engineering', 'Seminar', 'Seminar Hall 2', 12 * HOUR, 2, DAY, 80, 30, {
    description: 'Registration has already closed for this one.',
  }),
  event('mock-6', 'Photography Club Meetup', 'Club Activity', 'Cafeteria Lawn', -HOUR, 3, DAY, 30, 18, {
    description: 'Happening right now.',
  }),
  event('mock-7', 'Intro to Git and GitHub', 'Workshop', 'Lab 1, CSE Block', -3 * DAY, 2, DAY, 60, 55, {
    description: 'Already finished.',
  }),
]

// Same rules as the server (server/src/utils/eventStatus.js).
function withCalculatedFields(raw, now = new Date()) {
  const start = new Date(raw.startDateTime)
  const end = new Date(raw.endDateTime)
  const deadline = new Date(raw.registrationDeadline)

  let status = 'Upcoming'
  if (raw.status === 'Cancelled') status = 'Cancelled'
  else if (now > end) status = 'Completed'
  else if (now >= start) status = 'Ongoing'

  const seatsLeft = Math.max(raw.capacity - raw.registeredCount, 0)
  return {
    ...raw,
    status,
    seatsLeft,
    isFull: seatsLeft === 0,
    registrationOpen: status === 'Upcoming' && seatsLeft > 0 && now < deadline,
  }
}

// Pretend the network takes a moment, so loading states are visible in the demo.
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

export async function listEvents({ page = 1, limit = 20 } = {}) {
  await delay()
  const sorted = [...stored].sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))
  const pageItems = sorted.slice((page - 1) * limit, page * limit)
  return {
    data: pageItems.map((e) => withCalculatedFields(e)),
    meta: { page, limit, total: sorted.length },
  }
}

export async function getEvent(id) {
  await delay()
  const found = stored.find((e) => e._id === id)
  if (!found) {
    const error = new Error('Event not found')
    error.code = 'NOT_FOUND'
    throw error
  }
  return { data: withCalculatedFields(found) }
}

// Same rules and messages as the server's Event model (EVENT-02, 03, 08).
function validate(input) {
  const errors = {}
  const text = (value) => (typeof value === 'string' ? value.trim() : '')
  const now = Date.now()

  const title = text(input.title)
  if (!title) errors.title = 'Title is required'
  else if (title.length > 100) errors.title = 'Title must be at most 100 characters'

  if (!input.category) errors.category = 'Category is required'
  else if (!CATEGORIES.includes(input.category)) errors.category = 'Category must be one of: ' + CATEGORIES.join(', ')

  const venue = text(input.venue)
  if (!venue) errors.venue = 'Venue is required'
  else if (venue.length > 150) errors.venue = 'Venue must be at most 150 characters'

  if (text(input.description).length > 1000) errors.description = 'Description must be at most 1000 characters'

  const start = input.startDateTime ? new Date(input.startDateTime).getTime() : null
  const end = input.endDateTime ? new Date(input.endDateTime).getTime() : null
  const deadline = input.registrationDeadline ? new Date(input.registrationDeadline).getTime() : null

  if (start === null) errors.startDateTime = 'Start date and time is required'
  else if (Number.isNaN(start)) errors.startDateTime = 'startDateTime has an invalid value'
  else if (start <= now) errors.startDateTime = 'Start date and time must be in the future'

  if (end === null) errors.endDateTime = 'End date and time is required'
  else if (Number.isNaN(end)) errors.endDateTime = 'endDateTime has an invalid value'
  else if (start !== null && !Number.isNaN(start) && end <= start) errors.endDateTime = 'End date and time must be after the start'

  if (deadline === null) errors.registrationDeadline = 'Registration deadline is required'
  else if (Number.isNaN(deadline)) errors.registrationDeadline = 'registrationDeadline has an invalid value'
  else if (deadline <= now) errors.registrationDeadline = 'Registration deadline must be in the future'
  else if (start !== null && !Number.isNaN(start) && deadline > start) errors.registrationDeadline = 'Registration deadline cannot be after the start'

  const capacity = input.capacity === undefined || input.capacity === null || input.capacity === '' ? null : Number(input.capacity)
  if (capacity === null) errors.capacity = 'Capacity is required'
  else if (Number.isNaN(capacity)) errors.capacity = 'capacity has an invalid value'
  else if (capacity < 1) errors.capacity = 'Capacity must be at least 1'
  else if (capacity > 99999) errors.capacity = 'Capacity must be at most 99999'
  else if (!Number.isInteger(capacity)) errors.capacity = 'Capacity must be a whole number'

  return errors
}

// New events live in memory only: they disappear when the page is reloaded.
export async function createEvent(input) {
  await delay()
  const errors = validate(input)
  if (Object.keys(errors).length > 0) {
    const error = new Error('Some fields are missing or invalid')
    error.code = 'VALIDATION_ERROR'
    error.details = errors
    throw error
  }
  const created = {
    _id: `mock-${stored.length + 1}`,
    title: input.title.trim(),
    description: (input.description || '').trim(),
    category: input.category,
    venue: input.venue.trim(),
    startDateTime: new Date(input.startDateTime).toISOString(),
    endDateTime: new Date(input.endDateTime).toISOString(),
    registrationDeadline: new Date(input.registrationDeadline).toISOString(),
    capacity: Number(input.capacity),
    registeredCount: 0,
    status: 'Upcoming',
    organizer: '000000000000000000000001',
  }
  stored.push(created)
  return { data: withCalculatedFields(created) }
}
