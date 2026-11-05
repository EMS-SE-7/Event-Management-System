// Sample attendance and report data for demo mode (VITE_USE_MOCK=true), same shapes as the server.
const wait = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

const events = [
  { id: 'mock-1', title: 'Hackathon 2026', status: 'Upcoming', venue: 'MRD Auditorium', capacity: 100 },
  { id: 'mock-7', title: 'Intro to Git and GitHub', status: 'Completed', venue: 'Lab 1, CSE Block', capacity: 60 },
]

const registrations = {
  'mock-1': [
    { _id: 'r1', attendanceStatus: 'Not Marked', student: { name: 'Asha Rao', email: 'asha@pesu.pes.edu' } },
    { _id: 'r2', attendanceStatus: 'Not Marked', student: { name: 'Vikram S', email: 'vikram@pesu.pes.edu' } },
  ],
  'mock-7': [
    { _id: 'r3', attendanceStatus: 'Present', student: { name: 'Neha K', email: 'neha@pesu.pes.edu' } },
    { _id: 'r4', attendanceStatus: 'Absent', student: { name: 'Rahul M', email: 'rahul@pesu.pes.edu' } },
    { _id: 'r5', attendanceStatus: 'Present', student: { name: 'Divya P', email: 'divya@pesu.pes.edu' } },
  ],
}

function stats(event) {
  const list = registrations[event.id] || []
  const present = list.filter((r) => r.attendanceStatus === 'Present').length
  const absent = list.filter((r) => r.attendanceStatus === 'Absent').length
  return {
    registration: {
      total: list.length,
      cancelled: 0,
      capacity: event.capacity,
      seatsLeft: event.capacity - list.length,
      fillRate: Math.round((list.length / event.capacity) * 1000) / 10,
    },
    attendance: { present, absent, notMarked: list.length - present - absent },
  }
}

function notFound(what) {
  const error = new Error(`${what} not found`)
  error.code = 'NOT_FOUND'
  return error
}

export async function getMyEvents() {
  await wait()
  return { events: events.map((e) => ({ id: e.id, title: e.title, status: e.status, registered: (registrations[e.id] || []).length })) }
}

export async function getEventAttendance(eventId) {
  await wait()
  const event = events.find((e) => e.id === eventId)
  if (!event) throw notFound('Event')
  return { event: { id: event.id, title: event.title }, registrations: registrations[eventId] }
}

export async function markAttendance(registrationId, status) {
  await wait(150)
  const reg = Object.values(registrations).flat().find((r) => r._id === registrationId)
  if (!reg) throw notFound('Registration')
  reg.attendanceStatus = status
  return { status: 'success', registration: reg }
}

export async function getMyReports() {
  await wait()
  const list = events.map((e) => ({ id: e.id, title: e.title, status: e.status, ...stats(e) }))
  const totals = list.reduce(
    (sum, r) => ({
      registrations: sum.registrations + r.registration.total,
      present: sum.present + r.attendance.present,
      absent: sum.absent + r.attendance.absent,
    }),
    { registrations: 0, present: 0, absent: 0 },
  )
  return { events: list, totals }
}

export async function getEventReport(eventId) {
  await wait()
  const event = events.find((e) => e.id === eventId)
  if (!event) throw notFound('Event')
  return { event: { id: event.id, title: event.title, status: event.status, venue: event.venue }, ...stats(event) }
}
